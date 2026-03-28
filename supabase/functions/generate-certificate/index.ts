import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";
import qrcodegen from "https://esm.sh/qrcode-generator@1.4.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function drawQRCodeOnPage(page: any, text: string, x: number, y: number, size: number, color: any, bgColor: any) {
  const qr = qrcodegen(0, 'M');
  qr.addData(text);
  qr.make();
  const moduleCount = qr.getModuleCount();
  const cellSize = size / moduleCount;
  
  // Draw background
  page.drawRectangle({ x, y: y - size, width: size, height: size, color: bgColor });
  
  // Draw modules
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (qr.isDark(row, col)) {
        page.drawRectangle({
          x: x + col * cellSize,
          y: y - (row + 1) * cellSize,
          width: cellSize,
          height: cellSize,
          color,
        });
      }
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Acesso negado' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { briefId } = await req.json();

    // Get brief
    const { data: brief, error: briefError } = await supabase
      .from('briefs')
      .select('*')
      .eq('id', briefId)
      .single();

    if (briefError || !brief) {
      return new Response(JSON.stringify({ error: 'Brief não encontrado' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── 1. Generate SHA-256 hash ──
    let hashHex = '';
    if (brief.audio_url) {
      const { data: fileData } = await supabase.storage
        .from('audio-files')
        .download(brief.audio_url);
      if (fileData) {
        const arrayBuffer = await fileData.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
        hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
      }
    }
    if (!hashHex) {
      const encoder = new TextEncoder();
      const data = encoder.encode(brief.texto + brief.nome + new Date().toISOString());
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // ── 2. Generate sequential number ──
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const { data: seqData } = await supabase.rpc('nextval_cert_seq');
    const seq = seqData || Math.floor(Math.random() * 999) + 1;
    const certNumber = `SVZ-${year}-${month}-${String(seq).padStart(3, '0')}`;

    // ── 3. Build verification URL & QR Code ──
    const siteUrl = 'https://sanzo-voice-certify.lovable.app';
    const verifyUrl = `${siteUrl}/verificar/${certNumber}`;
    // QR code will be drawn directly on the PDF
    const qrPublicUrl = { publicUrl: verifyUrl };

    // ── 4. Generate branded PDF certificate ──
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();

    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontMono = await pdfDoc.embedFont(StandardFonts.Courier);

    const gold = rgb(0.788, 0.659, 0.298); // #C9A84C
    const dark = rgb(0.039, 0.039, 0.039);
    const gray = rgb(0.55, 0.55, 0.55);
    const white = rgb(1, 1, 1);

    // Background
    page.drawRectangle({ x: 0, y: 0, width, height, color: dark });

    // Gold border
    const borderMargin = 30;
    const borderWidth = 1.5;
    page.drawRectangle({
      x: borderMargin, y: borderMargin,
      width: width - borderMargin * 2, height: height - borderMargin * 2,
      borderColor: gold, borderWidth, color: rgb(0, 0, 0), opacity: 0,
    });
    // Inner border
    page.drawRectangle({
      x: borderMargin + 8, y: borderMargin + 8,
      width: width - (borderMargin + 8) * 2, height: height - (borderMargin + 8) * 2,
      borderColor: rgb(0.5, 0.42, 0.19), borderWidth: 0.5, color: rgb(0, 0, 0), opacity: 0,
    });

    // Header
    const centerX = width / 2;
    let y = height - 80;

    page.drawText('SANZONY.VOZ', {
      x: centerX - fontBold.widthOfTextAtSize('SANZONY.VOZ', 32) / 2,
      y, size: 32, font: fontBold, color: gold,
    });
    y -= 22;
    page.drawText('STUDIO DE LOCUÇÃO COMERCIAL & PUBLICITÁRIA', {
      x: centerX - fontRegular.widthOfTextAtSize('STUDIO DE LOCUÇÃO COMERCIAL & PUBLICITÁRIA', 8) / 2,
      y, size: 8, font: fontRegular, color: gray,
    });

    // Separator line
    y -= 20;
    page.drawLine({ start: { x: 80, y }, end: { x: width - 80, y }, thickness: 0.5, color: gold });

    // Title
    y -= 40;
    page.drawText('CERTIFICADO DE AUTENTICIDADE', {
      x: centerX - fontBold.widthOfTextAtSize('CERTIFICADO DE AUTENTICIDADE', 22) / 2,
      y, size: 22, font: fontBold, color: gold,
    });
    y -= 18;
    page.drawText('ÁUDIO CERTIFICADO DIGITALMENTE', {
      x: centerX - fontRegular.widthOfTextAtSize('ÁUDIO CERTIFICADO DIGITALMENTE', 10) / 2,
      y, size: 10, font: fontRegular, color: gray,
    });

    // Certificate number
    y -= 40;
    page.drawText(certNumber, {
      x: centerX - fontBold.widthOfTextAtSize(certNumber, 28) / 2,
      y, size: 28, font: fontBold, color: gold,
    });

    // Separator
    y -= 25;
    page.drawLine({ start: { x: 140, y }, end: { x: width - 140, y }, thickness: 0.5, color: rgb(0.3, 0.3, 0.3) });

    // Data fields
    y -= 35;
    const leftCol = 80;
    const rightCol = 260;
    const fieldSpacing = 32;
    const emissionDate = now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) + ' às ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'America/Sao_Paulo' });

    const fields = [
      { label: 'CLIENTE', value: brief.nome },
      { label: 'EMPRESA', value: brief.empresa || 'Pessoa Física' },
      { label: 'TIPO DE LOCUÇÃO', value: brief.tipo_locucao },
      { label: 'DATA DE EMISSÃO', value: emissionDate },
      { label: 'ARQUIVO', value: brief.audio_filename || 'N/A' },
    ];

    for (const field of fields) {
      page.drawText(field.label, { x: leftCol, y, size: 8, font: fontBold, color: gray });
      page.drawText(field.value, { x: rightCol, y, size: 11, font: fontRegular, color: white });
      y -= fieldSpacing;
    }

    // SHA-256 Hash section
    y -= 10;
    page.drawLine({ start: { x: 80, y: y + 15 }, end: { x: width - 80, y: y + 15 }, thickness: 0.5, color: rgb(0.3, 0.3, 0.3) });
    y -= 10;

    page.drawText('HASH SHA-256 DO ARQUIVO', { x: leftCol, y, size: 8, font: fontBold, color: gold });
    y -= 18;
    // Break hash into two lines for readability
    const hashLine1 = hashHex.substring(0, 32);
    const hashLine2 = hashHex.substring(32);
    page.drawText(hashLine1, { x: leftCol, y, size: 8, font: fontMono, color: white });
    y -= 14;
    page.drawText(hashLine2, { x: leftCol, y, size: 8, font: fontMono, color: white });

    // QR Code section
    y -= 35;
    page.drawLine({ start: { x: 80, y: y + 15 }, end: { x: width - 80, y: y + 15 }, thickness: 0.5, color: rgb(0.3, 0.3, 0.3) });
    y -= 5;

    const qrSize = 120;
    const qrX = centerX - qrSize / 2;
    drawQRCodeOnPage(page, verifyUrl, qrX, y, qrSize, gold, dark);
    y -= qrSize + 14;

    page.drawText('Escaneie para verificar a autenticidade', {
      x: centerX - fontRegular.widthOfTextAtSize('Escaneie para verificar a autenticidade', 8) / 2,
      y, size: 8, font: fontRegular, color: gray,
    });
    y -= 12;
    page.drawText(verifyUrl, {
      x: centerX - fontMono.widthOfTextAtSize(verifyUrl, 7) / 2,
      y, size: 7, font: fontMono, color: gold,
    });

    // Legal section
    y -= 25;
    page.drawLine({ start: { x: 80, y: y + 10 }, end: { x: width - 80, y: y + 10 }, thickness: 0.5, color: rgb(0.3, 0.3, 0.3) });
    y -= 8;
    page.drawText('DECLARAÇÃO JURÍDICA', { x: leftCol, y, size: 7, font: fontBold, color: gold });
    y -= 14;

    const legalLines = [
      `Certifico que o áudio nº ${certNumber} foi produzido pelo Studio Sanzony.Voz e é de`,
      `propriedade exclusiva de ${brief.nome}. Integridade garantida pelo hash SHA-256.`,
      `Reprodução ou uso não autorizado viola a Lei nº 9.610/98.`,
      `Verificável publicamente via QR Code acima.`,
    ];

    for (const line of legalLines) {
      page.drawText(line, { x: leftCol, y, size: 7, font: fontRegular, color: gray });
      y -= 11;
    }

    // Footer
    const footerY = borderMargin + 20;
    page.drawText('Áudio Certificado Digitalmente – Sanzony.Voz™', {
      x: centerX - fontRegular.widthOfTextAtSize('Áudio Certificado Digitalmente – Sanzony.Voz™', 7) / 2,
      y: footerY, size: 7, font: fontRegular, color: gold,
    });
    page.drawText('Este certificado é verificável em: ' + siteUrl, {
      x: centerX - fontMono.widthOfTextAtSize('Este certificado é verificável em: ' + siteUrl, 5.5) / 2,
      y: footerY - 10, size: 5.5, font: fontMono, color: gray,
    });

    // Save PDF
    const pdfBytes = await pdfDoc.save();

    // Upload PDF to storage
    const pdfPath = `pdf/${certNumber}.pdf`;
    const { error: pdfUploadError } = await supabase.storage.from('certificates').upload(pdfPath, pdfBytes, {
      contentType: 'application/pdf', upsert: true,
    });

    if (pdfUploadError) {
      console.error('PDF upload error:', pdfUploadError);
    }

    const { data: pdfPublicUrl } = supabase.storage.from('certificates').getPublicUrl(pdfPath);

    // ── 5. Update brief with all certificate data ──
    const { data: updated, error: updateError } = await supabase
      .from('briefs')
      .update({
        hash_sha256: hashHex,
        numero_certificado: certNumber,
        certificado_gerado: true,
        certificado_url: pdfPublicUrl.publicUrl,
        qr_code_url: qrPublicUrl.publicUrl,
        status: 'certificado',
      })
      .eq('id', briefId)
      .select()
      .single();

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      certificate: {
        numero: certNumber,
        hash: hashHex,
        pdf_url: pdfPublicUrl.publicUrl,
        qr_url: qrPublicUrl.publicUrl,
        verify_url: verifyUrl,
        brief: updated,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Certificate generation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

import { describe, it, expect } from 'vitest';
import { normalizeJID, buildDeliveryMessage, isValidWhatsApp } from './whatsappService';

describe('whatsappService - Pure Logic', () => {
  describe('isValidWhatsApp', () => {
    it('should validate correct Brazilian numbers', () => {
      expect(isValidWhatsApp('81981374109')).toBe(true);
      expect(isValidWhatsApp('11999999999')).toBe(true);
      expect(isValidWhatsApp('1188888888')).toBe(true);
    });

    it('should invalidate incorrect numbers', () => {
      expect(isValidWhatsApp('')).toBe(false);
      expect(isValidWhatsApp('123')).toBe(false);
    });
  });

  describe('normalizeJID', () => {
    it('should add 55 and suffix to 10-digit numbers', () => {
      expect(normalizeJID('8188888888')).toBe('558188888888@s.whatsapp.net');
    });

    it('should apply the "REGRA DE OURO SANZONY" for 11-digit numbers', () => {
      const input = '5581981374109';
      expect(normalizeJID(input)).toBe('558181374109@s.whatsapp.net');
    });

    it('should handle already normalized JIDs', () => {
      expect(normalizeJID('558181374109@s.whatsapp.net')).toBe('558181374109@s.whatsapp.net');
    });
  });

  describe('buildDeliveryMessage', () => {
    it('should build a formatted message with certificate and contact info', () => {
      const payload = {
        nome: 'João',
        whatsapp: '81981374109',
        numero_certificado: 'SVZ-123',
      };
      const msg = buildDeliveryMessage(payload);
      expect(msg).toContain('Olá, João! 🎙️');
      expect(msg).toContain('SVZ-123');
      expect(msg).toContain('Sanzony.Voz™');
      expect(msg).toContain('_Instagram_: @sanzony.voz');
      expect(msg).toContain('_Website_: sanzonyvoz.com.br');
      expect(msg).toContain('_Whatsapp_: 81 97121-2995');
      expect(msg).toContain('Qualidade');
      expect(msg).toContain('Agilidade');
      expect(msg).toContain('Excelência');
    });
  });
});

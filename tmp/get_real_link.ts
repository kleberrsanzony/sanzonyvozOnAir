import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://etlimwchxuwoebgrsimh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0bGltd2NocHV3b2ViZ3JzaW1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTI2MTkxMDAsImV4cCI6MjAyODIwNzA0NH0.8z8X BonVrGytdjb3V2hAa2tw7QG7orsuC5qA8MTSdL0' // Valor truncado por segurança, mas o tsx vai ler

const supabase = createClient(supabaseUrl, supabaseKey)
const path = '683f13c7-afd8-4375-a24a-8a6f0f14ca62/1775099779411_SPOT LUNARO - ARGENTINA.mp3'
const { data } = supabase.storage.from('audio-files').getPublicUrl(path)

console.log('SDK_LINK:' + data.publicUrl)

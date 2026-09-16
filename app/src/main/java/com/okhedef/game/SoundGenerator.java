package com.okhedef.game;

import android.media.AudioFormat;
import android.media.AudioTrack;

public class SoundGenerator {

    private static final int SAMPLE_RATE = 22050;

    // Arka planda kısa ve temiz bip/ses sinyali üretip çalan metot
    public static void playTone(double frequency, int durationMs, double volume) {
        new Thread(() -> {
            try {
                int numSamples = (int) ((durationMs / 1000.0) * SAMPLE_RATE);
                byte[] generatedSnd = new byte[2 * numSamples];
                double sample;

                for (int i = 0; i < numSamples; ++i) {
                    double time = i / (double) SAMPLE_RATE;
                    // Sinyal sönümleme (Envelope) ile tıklama seslerini önleme
                    double envelope = 1.0;
                    if (i < numSamples * 0.1) {
                        envelope = i / (numSamples * 0.1);
                    } else if (i > numSamples * 0.8) {
                        envelope = (numSamples - i) / (numSamples * 0.2);
                    }

                    sample = Math.sin(2 * Math.PI * frequency * time) * envelope * volume;

                    // 16-bit PCM dönüşümü
                    short val = (short) (sample * 32767);
                    generatedSnd[2 * i] = (byte) (val & 0x00ff);
                    generatedSnd[2 * i + 1] = (byte) ((val & 0xff00) >>> 8);
                }

                AudioTrack audioTrack = new AudioTrack(
                        android.media.AudioManager.STREAM_MUSIC,
                        SAMPLE_RATE,
                        AudioFormat.CHANNEL_OUT_MONO,
                        AudioFormat.ENCODING_PCM_16BIT,
                        generatedSnd.length,
                        AudioTrack.MODE_STATIC
                );

                audioTrack.write(generatedSnd, 0, generatedSnd.length);
                audioTrack.play();

                // Sesin çalması bitene kadar bekle ve serbest bırak
                Thread.sleep(durationMs + 50);
                audioTrack.release();
            } catch (Exception e) {
                // Ignore audio generation errors
            }
        }).start();
    }

    // Yay Gerilme Sesi (Artan frekans)
    public static void playBowPull() {
        playTone(300, 150, 0.3);
    }

    // Ok Fırlatma Sesi (Yüksekten düşen ıslık)
    public static void playArrowRelease() {
        playTone(800, 100, 0.4);
    }

    // Hedefe Vuruş Sesi (Tok ses)
    public static void playTargetHit() {
        playTone(180, 120, 0.5);
    }

    // Tam Merkez (Bullseye) Kutlama Sesi (Çift tonlu neşeli bip)
    public static void playBullseye() {
        playTone(587.33, 100, 0.6); // D5
        try { Thread.sleep(80); } catch (Exception e) {}
        playTone(880.00, 150, 0.6); // A5
    }
}

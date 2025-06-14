import { 
    getAudioContext,
    getStereoPannerNode,
    setPanValue,
    getCurrentPanValue,
    getCurrentAudioMode,
    setAudioMode
} from './audioContext';
import logger from './logger';

/**
 * Testet den StereoPanner mit einem generierten Testsignal
 * @param panValue - Pan-Wert zum Testen (-1 = links, 0 = mitte, 1 = rechts)
 * @param duration - Dauer des Tests in Sekunden (Standard: 2)
 * @param frequency - Frequenz des Testsignals in Hz (Standard: 440)
 */
export function testStereoPanner(panValue: number = 0, duration: number = 2, frequency: number = 440): void {
    const context = getAudioContext();
    const currentMode = getCurrentAudioMode();
    
    try {
        // Stelle sicher, dass der AudioContext läuft
        if (context.state === 'suspended') {
            context.resume();
        }
        
        // Erstelle Oszillator für Testsignal
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        
        // Konfiguriere Oszillator
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, context.currentTime);
        
        // Konfiguriere Lautstärke (leise für Komfort)
        gainNode.gain.setValueAtTime(0.1, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + duration);
        
        // Verbinde Audio-Graph
        oscillator.connect(gainNode);
        
        if (currentMode === 'stereopanner') {
            // Verwende StereoPanner
            const pannerNode = getStereoPannerNode();
            setPanValue(panValue);
            
            gainNode.connect(pannerNode);
            pannerNode.connect(context.destination);
            
            logger.info('StereoPanner-Test gestartet', {
                panValue: panValue,
                frequency: frequency,
                duration: duration,
                currentPanValue: pannerNode.pan.value
            });
        } else {
            // Direkte Verbindung für Vergleich
            gainNode.connect(context.destination);
            
            logger.info('Audio-Test gestartet (ohne StereoPanner)', {
                frequency: frequency,
                duration: duration
            });
        }
        
        // Starte und stoppe Oszillator
        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + duration);
        
        // Cleanup nach Test
        setTimeout(() => {
            try {
                oscillator.disconnect();
                gainNode.disconnect();
                logger.info('StereoPanner-Test beendet');
            } catch (error) {
                logger.warn('Cleanup-Fehler nach StereoPanner-Test:', error);
            }
        }, (duration + 0.1) * 1000);
        
        // Konsolen-Feedback
        console.log(`🎵 StereoPanner-Test: Pan=${panValue} (${panValue < 0 ? 'Links' : panValue > 0 ? 'Rechts' : 'Mitte'}), ${frequency}Hz für ${duration}s`);
        
    } catch (error) {
        logger.error('Fehler beim StereoPanner-Test:', error);
        throw error;
    }
}

/**
 * Führt eine Serie von Pan-Tests durch (Links -> Mitte -> Rechts)
 * @param stepDuration - Dauer jedes Test-Schritts in Sekunden
 */
export function testStereoPannerSequence(stepDuration: number = 1.5): void {
    logger.info('StereoPanner-Sequenz-Test gestartet');
    console.log('🎵 StereoPanner-Sequenz-Test: Links -> Mitte -> Rechts');
    
    // Stelle sicher, dass StereoPanner-Modus aktiv ist
    if (getCurrentAudioMode() !== 'stereopanner') {
        setAudioMode('stereopanner');
    }
    
    // Test-Sequenz
    setTimeout(() => {
        console.log('🔊 Test 1/3: Links (-1)');
        testStereoPanner(-1, stepDuration, 440);
    }, 0);
    
    setTimeout(() => {
        console.log('🔊 Test 2/3: Mitte (0)');
        testStereoPanner(0, stepDuration, 523); // C5
    }, stepDuration * 1000);
    
    setTimeout(() => {
        console.log('🔊 Test 3/3: Rechts (+1)');
        testStereoPanner(1, stepDuration, 659); // E5
    }, stepDuration * 2000);
    
    setTimeout(() => {
        console.log('✅ StereoPanner-Sequenz-Test abgeschlossen');
        logger.info('StereoPanner-Sequenz-Test abgeschlossen');
    }, stepDuration * 3000 + 500);
}

/**
 * Animiert den Pan-Wert von links nach rechts und zurück
 * @param duration - Gesamtdauer der Animation in Sekunden
 * @param frequency - Frequenz des Testsignals
 */
export function testStereoPannerSweep(duration: number = 4, frequency: number = 440): void {
    const context = getAudioContext();
    
    try {
        if (context.state === 'suspended') {
            context.resume();
        }
        
        // Stelle sicher, dass StereoPanner-Modus aktiv ist
        if (getCurrentAudioMode() !== 'stereopanner') {
            setAudioMode('stereopanner');
        }
        
        const pannerNode = getStereoPannerNode();
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        
        // Konfiguriere Audio
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, context.currentTime);
        gainNode.gain.setValueAtTime(0.1, context.currentTime);
        
        // Verbinde Audio-Graph
        oscillator.connect(gainNode);
        gainNode.connect(pannerNode);
        pannerNode.connect(context.destination);
        
        // Animiere Pan-Wert: Links -> Rechts -> Links
        const halfDuration = duration / 2;
        pannerNode.pan.setValueAtTime(-1, context.currentTime);
        pannerNode.pan.linearRampToValueAtTime(1, context.currentTime + halfDuration);
        pannerNode.pan.linearRampToValueAtTime(-1, context.currentTime + duration);
        
        // Fade out am Ende
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + duration);
        
        // Starte und stoppe
        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + duration);
        
        logger.info('StereoPanner-Sweep-Test gestartet', {
            duration: duration,
            frequency: frequency
        });
        
        console.log(`🎵 StereoPanner-Sweep: ${frequency}Hz für ${duration}s (Links ↔ Rechts)`);
        
        // Cleanup
        setTimeout(() => {
            try {
                oscillator.disconnect();
                gainNode.disconnect();
                logger.info('StereoPanner-Sweep-Test beendet');
                console.log('✅ StereoPanner-Sweep abgeschlossen');
            } catch (error) {
                logger.warn('Cleanup-Fehler nach Sweep-Test:', error);
            }
        }, (duration + 0.1) * 1000);
        
    } catch (error) {
        logger.error('Fehler beim StereoPanner-Sweep-Test:', error);
        throw error;
    }
}

/**
 * Globale Test-Utilities für StereoPanner-Tests
 * Diese Funktionen sind in der Browser-Konsole verfügbar
 */

/**
 * Schnelltest: Links
 */
export function testLeft(): void {
    console.log('🔊 Test: Audio nach LINKS verschieben');
    setAudioMode('stereopanner');
    testStereoPanner(-1, 2, 440);
}

/**
 * Schnelltest: Rechts
 */
export function testRight(): void {
    console.log('🔊 Test: Audio nach RECHTS verschieben');
    setAudioMode('stereopanner');
    testStereoPanner(1, 2, 440);
}

/**
 * Schnelltest: Mitte
 */
export function testCenter(): void {
    console.log('🔊 Test: Audio in der MITTE');
    setAudioMode('stereopanner');
    testStereoPanner(0, 2, 440);
}

/**
 * Vollständiger Test aller Positionen
 */
export function testAllPositions(): void {
    console.log('🎵 Vollständiger StereoPanner-Test wird gestartet...');
    testStereoPannerSequence(1.5);
}

/**
 * Sweep-Test (animierte Pan-Bewegung)
 */
export function testSweep(): void {
    console.log('🎵 StereoPanner-Sweep-Test wird gestartet...');
    testStereoPannerSweep(4, 440);
}

/**
 * Setzt Pan-Wert manuell
 * @param value - Pan-Wert zwischen -1 (links) und 1 (rechts)
 */
export function setPan(value: number): void {
    const clampedValue = Math.max(-1, Math.min(1, value));
    setAudioMode('stereopanner');
    setPanValue(clampedValue);
    console.log(`🎛️ Pan-Wert gesetzt: ${clampedValue} (${clampedValue < 0 ? 'Links' : clampedValue > 0 ? 'Rechts' : 'Mitte'})`);
    logger.info('Pan-Wert manuell gesetzt:', { value: clampedValue });
}

/**
 * Zeigt aktuellen Status an
 */
export function showAudioStatus(): void {
    const mode = getCurrentAudioMode();
    const panValue = getCurrentPanValue();
    
    console.log('📊 Audio-Status:');
    console.log(`   Modus: ${mode}`);
    console.log(`   Pan-Wert: ${panValue} (${panValue < 0 ? 'Links' : panValue > 0 ? 'Rechts' : 'Mitte'})`);
    
    logger.info('Audio-Status abgefragt:', { mode, panValue });
}

/**
 * Wechselt zwischen Default und StereoPanner
 */
export function toggleMode(): void {
    const currentMode = getCurrentAudioMode();
    const newMode = currentMode === 'stereopanner' ? 'default' : 'stereopanner';
    setAudioMode(newMode);
    console.log(`🔄 Audio-Modus gewechselt: ${currentMode} → ${newMode}`);
}

/**
 * Hilfefunktion - zeigt alle verfügbaren Test-Kommandos
 */
export function showTestCommands(): void {
    console.log('🎵 StereoPanner Test-Kommandos:');
    console.log('');
    console.log('Schnelltests:');
    console.log('  testLeft()      - Audio nach links');
    console.log('  testRight()     - Audio nach rechts');
    console.log('  testCenter()    - Audio in der Mitte');
    console.log('');
    console.log('Erweiterte Tests:');
    console.log('  testAllPositions() - Alle Positionen testen');
    console.log('  testSweep()        - Animierter Pan-Sweep');
    console.log('');
    console.log('Manuelle Kontrolle:');
    console.log('  setPan(-1)         - Ganz nach links');
    console.log('  setPan(0)          - Mitte');
    console.log('  setPan(1)          - Ganz nach rechts');
    console.log('  setPan(0.5)        - Leicht nach rechts');
    console.log('');
    console.log('Status & Kontrolle:');
    console.log('  showAudioStatus()  - Aktueller Status');
    console.log('  toggleMode()       - Modus wechseln');
    console.log('');
    console.log('💡 Tipp: Kopfhörer verwenden für besten Stereo-Effekt!');
}

// Mache Funktionen global verfügbar (für Browser-Konsole)
if (typeof window !== 'undefined') {
    (window as any).testLeft = testLeft;
    (window as any).testRight = testRight;
    (window as any).testCenter = testCenter;
    (window as any).testAllPositions = testAllPositions;
    (window as any).testSweep = testSweep;
    (window as any).setPan = setPan;
    (window as any).showAudioStatus = showAudioStatus;
    (window as any).toggleMode = toggleMode;
    (window as any).showTestCommands = showTestCommands;
    
    // Zeige Hilfe beim Laden
    console.log('🎵 StereoPanner Test-Utils geladen!');
    console.log('Tippe showTestCommands() für alle verfügbaren Kommandos.');
} 
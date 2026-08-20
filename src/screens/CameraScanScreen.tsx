import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { X, Zap, ZapOff, Image as ImageIcon } from 'lucide-react-native';
import { triggerHaptic } from '../utils/haptics';
import { useTranslation } from '../i18n';

interface CameraScanScreenProps {
  onCapture: (imageUri: string, isBarcode?: boolean, imageBase64?: string) => void;
  onClose: () => void;
}

export const CameraScanScreen: React.FC<CameraScanScreenProps> = ({ onCapture, onClose }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const [mode, setMode] = useState<'food' | 'barcode' | 'label'>('food');
  const [flash, setFlash] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const { t } = useTranslation();

  if (!permission) {
    return <View style={{ flex: 1, backgroundColor: '#000' }} />;
  }

  if (!permission.granted) {
    // Once the user has denied twice, iOS stops showing the system prompt, so
    // requestPermission() would do nothing at all. Send them to Settings, which
    // is the only place the decision can still be changed.
    const mustUseSettings = !permission.canAskAgain;

    return (
      <View style={styles.permissionBox}>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 12 }}>
          {mustUseSettings
            ? t('camera.permissionDenied')
            : t('camera.permissionRequest')}
        </Text>
        {mustUseSettings && (
          <Text style={{ color: '#aaa', fontSize: 13, textAlign: 'center', marginBottom: 16, lineHeight: 19 }}>
            {t('camera.settingsGuide')}
          </Text>
        )}
        <TouchableOpacity
          onPress={mustUseSettings ? () => Linking.openSettings() : requestPermission}
          style={styles.btnPrimary}
        >
          <Text style={{ color: '#000', fontWeight: '800' }}>
            {mustUseSettings ? t('camera.openSettings') : t('camera.grantPermission')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} style={{ marginTop: 16 }}>
          <Text style={{ color: '#aaa' }}>{t('common.close')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCapture = async () => {
    triggerHaptic('heavy');
    setCaptureError(null);

    if (!cameraRef.current) {
      setCaptureError(t('camera.cameraNotReady'));
      return;
    }

    try {
      // base64 is what /meal/analyze expects; the uri is only for local preview.
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: true });

      if (!photo?.uri) {
        // Previously this fell through to a hardcoded stock photo, so the user
        // ended up logging a meal they had never photographed.
        setCaptureError(t('camera.captureError'));
        return;
      }

      onCapture(photo.uri, mode === 'barcode', photo.base64 ?? undefined);
    } catch {
      triggerHaptic('error');
      setCaptureError(t('camera.captureError'));
    }
  };

  const handlePickGallery = async () => {
    triggerHaptic('light');
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });
    if (!res.canceled && res.assets[0]) {
      onCapture(res.assets[0].uri, false, res.assets[0].base64 ?? undefined);
    } else if (!res.canceled) {
      setCaptureError(t('camera.galleryError'));
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={flash}
        barcodeScannerSettings={mode === 'barcode' ? { barcodeTypes: ['ean13', 'qr', 'upc_a'] } : undefined}
        onBarcodeScanned={mode === 'barcode' ? ({ data }) => {
          triggerHaptic('success');
          onCapture(data, true);
        } : undefined}
      />

      {/* Top Controls Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
          <X size={20} color="#fff" />
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity onPress={() => setFlash(!flash)} style={[styles.iconBtn, flash && { backgroundColor: '#F5A524' }]}>
            {flash ? <Zap size={20} color="#fff" /> : <ZapOff size={20} color="#fff" />}
          </TouchableOpacity>

          <TouchableOpacity onPress={handlePickGallery} style={styles.iconBtn}>
            <ImageIcon size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {captureError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{captureError}</Text>
        </View>
      )}

      {/* Center Viewfinder */}
      <View style={styles.centerArea}>
        <View style={[styles.viewfinder, mode === 'barcode' && { height: 130 }]} />
        <View style={styles.modeHint}>
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>
            {mode === 'food' ? t('camera.placeFood') : mode === 'barcode' ? t('camera.placeBarcode') : t('camera.captureLabel')}
          </Text>
        </View>
      </View>

      {/* Bottom Mode Switcher & Shutter Button */}
      <View style={styles.bottomArea}>
        <View style={styles.modeSelector}>
          {(['food', 'barcode', 'label'] as const).map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => {
                triggerHaptic('light');
                setMode(m);
              }}
              style={[styles.modeTab, mode === m && styles.modeTabActive]}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: mode === m ? '#000' : '#fff' }}>
                {m === 'food' ? t('camera.food') : m === 'barcode' ? t('camera.barcode') : t('camera.label')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={handleCapture} style={styles.shutter}>
          <View style={styles.shutterCore} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  permissionBox: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', padding: 24 },
  btnPrimary: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50 },
  iconBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  centerArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  viewfinder: { width: 280, height: 280, borderRadius: 28, borderWidth: 3, borderColor: '#fff' },
  modeHint: { marginTop: 20, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.7)' },
  bottomArea: { alignItems: 'center', paddingBottom: 40 },
  modeSelector: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.6)', padding: 4, borderRadius: 999, marginBottom: 20 },
  modeTab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 },
  modeTabActive: { backgroundColor: '#fff' },
  shutter: { width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: '#fff', padding: 4 },
  shutterCore: { flex: 1, backgroundColor: '#fff', borderRadius: 35 },
  errorBanner: {
    position: 'absolute',
    top: 96,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(229, 72, 77, 0.95)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14
  },
  errorText: { color: '#fff', fontSize: 13, fontWeight: '700', textAlign: 'center' }
});

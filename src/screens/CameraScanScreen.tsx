import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { X, Zap, ZapOff, Image as ImageIcon } from 'lucide-react-native';
import { triggerHaptic } from '../utils/haptics';

interface CameraScanScreenProps {
  onCapture: (imageUri: string, isBarcode?: boolean) => void;
  onClose: () => void;
}

export const CameraScanScreen: React.FC<CameraScanScreenProps> = ({ onCapture, onClose }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const [mode, setMode] = useState<'food' | 'barcode' | 'label'>('food');
  const [flash, setFlash] = useState(false);

  if (!permission) {
    return <View style={{ flex: 1, backgroundColor: '#000' }} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionBox}>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 12 }}>
          Cho phép CalTrack AI truy cập Máy ảnh để quét món ăn
        </Text>
        <TouchableOpacity onPress={requestPermission} style={styles.btnPrimary}>
          <Text style={{ color: '#000', fontWeight: '800' }}>Cấp quyền Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} style={{ marginTop: 16 }}>
          <Text style={{ color: '#aaa' }}>Đóng</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCapture = async () => {
    triggerHaptic('heavy');
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
        if (photo?.uri) onCapture(photo.uri, mode === 'barcode');
      } catch {
        onCapture('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80', mode === 'barcode');
      }
    } else {
      onCapture('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80', mode === 'barcode');
    }
  };

  const handlePickGallery = async () => {
    triggerHaptic('light');
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8
    });
    if (!res.canceled && res.assets[0]) {
      onCapture(res.assets[0].uri);
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

      {/* Center Viewfinder */}
      <View style={styles.centerArea}>
        <View style={[styles.viewfinder, mode === 'barcode' && { height: 130 }]} />
        <View style={styles.modeHint}>
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>
            {mode === 'food' ? 'Đặt món ăn trong khung' : mode === 'barcode' ? 'Đưa mã vạch vào giữa' : 'Chụp rõ bảng dinh dưỡng'}
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
                {m === 'food' ? 'Món ăn' : m === 'barcode' ? 'Mã vạch' : 'Nhãn vi chất'}
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
  shutterCore: { flex: 1, backgroundColor: '#fff', borderRadius: 35 }
});

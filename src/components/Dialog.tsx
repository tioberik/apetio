import { type ReactNode, useEffect, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Centrirani "keyboard-safe" popup. Pozicija se računa iz STVARNE visine tastature
 * (Keyboard API) jer se na nekim Androidima ekran ne smanjuje pa KeyboardAvoidingView
 * ne pomaže. Reusable za sve buduće male dijaloge.
 */
export function Dialog({ visible, onClose, children }: Props) {
  const { colors } = useTheme();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) =>
      setKeyboardHeight(e.endCoordinates.height),
    );
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  if (!visible) return null;

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: 'rgba(0,0,0,0.55)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          paddingBottom: 24 + keyboardHeight,
        },
      ]}
    >
      <Pressable accessibilityRole="button" style={StyleSheet.absoluteFill} onPress={onClose} />
      {/* Kartica hvata dodire (ne zatvara se pri dodiru na nju). */}
      <Pressable onPress={() => {}} style={{ width: '100%', maxWidth: 420 }}>
        <View
          style={{ backgroundColor: colors.surface, borderRadius: 18, padding: 20, gap: 16 }}
        >
          {children}
        </View>
      </Pressable>
    </View>
  );
}

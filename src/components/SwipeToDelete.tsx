import React, { useMemo, useRef } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons/static';
import { useAppTheme } from '../context/ThemeContext';
import { AppColors, spacing } from '../theme';

const DELETE_WIDTH = 76;
// How far left a release has to be to snap the row open (rather than back
// closed) - deliberately short of a full swipe-to-dismiss gesture, so
// deleting always takes a second, explicit tap on the revealed button
// instead of a single fast swipe removing something by accident.
const SWIPE_OPEN_THRESHOLD = -40;
const TAP_SLOP = 4;

interface Props {
  onDelete: () => void;
  children: React.ReactNode;
}

/**
 * Swipe-left-to-reveal-delete for a list row, built on React Native's
 * built-in Animated/PanResponder rather than react-native-gesture-handler -
 * this app doesn't have that native module installed, and adding it means
 * another npm install + pod install + clean rebuild (the same class of
 * step as the icon font pod that was missing earlier), so this stays pure
 * JS with no new native dependency.
 */
export default function SwipeToDelete({ onDelete, children }: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const translateX = useRef(new Animated.Value(0)).current;
  const openRef = useRef(false);

  const close = () => {
    openRef.current = false;
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
  };

  const open = () => {
    openRef.current = true;
    Animated.spring(translateX, { toValue: -DELETE_WIDTH, useNativeDriver: true }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      // Once open, a plain tap anywhere on the row should close it again -
      // claim the responder on touch-down only in that state.
      onStartShouldSetPanResponder: () => openRef.current,
      onMoveShouldSetPanResponder: (_evt, gesture) =>
        Math.abs(gesture.dx) > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderMove: (_evt, gesture) => {
        const base = openRef.current ? -DELETE_WIDTH : 0;
        const next = Math.min(0, Math.max(-DELETE_WIDTH, base + gesture.dx));
        translateX.setValue(next);
      },
      onPanResponderRelease: (_evt, gesture) => {
        const isTap = Math.abs(gesture.dx) < TAP_SLOP && Math.abs(gesture.dy) < TAP_SLOP;
        if (isTap && openRef.current) {
          close();
          return;
        }
        const base = openRef.current ? -DELETE_WIDTH : 0;
        const finalValue = base + gesture.dx;
        if (finalValue < SWIPE_OPEN_THRESHOLD) {
          open();
        } else {
          close();
        }
      },
      onPanResponderTerminate: close,
    }),
  ).current;

  return (
    <View style={styles.wrap}>
      <View style={styles.deleteBackground}>
        <Pressable
          onPress={() => {
            close();
            onDelete();
          }}
          style={styles.deleteButton}
          hitSlop={8}
        >
          <Ionicons name="trash" size={22} color={colors.background} />
        </Pressable>
      </View>
      <Animated.View
        style={[styles.foreground, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    wrap: { justifyContent: 'center' },
    deleteBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.danger,
      alignItems: 'flex-end',
      justifyContent: 'center',
    },
    deleteButton: {
      width: DELETE_WIDTH,
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.sm,
    },
    foreground: { backgroundColor: colors.background },
  });
}

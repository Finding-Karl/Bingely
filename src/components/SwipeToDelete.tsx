import React, { useMemo, useRef } from 'react';
import { Animated, Dimensions, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons/static';
import { useAppTheme } from '../context/ThemeContext';
import { AppColors, spacing } from '../theme';

const DELETE_WIDTH = 76;
// How far left a release has to be to snap the row open (rather than back
// closed) if it doesn't clear the full-swipe threshold below.
const SWIPE_OPEN_THRESHOLD = -40;
const TAP_SLOP = 4;
// Swiping (and releasing) past this point deletes immediately, same as the
// revealed button - mirrors iOS Mail/Messages, where a full swipe-through
// deletes without needing a second tap, while a shorter swipe just reveals
// the button. Measured against screen width so it scales across devices.
const FULL_SWIPE_THRESHOLD = -(Dimensions.get('window').width * 0.55);
const OFF_SCREEN = -Dimensions.get('window').width;

interface Props {
  onDelete: () => void;
  children: React.ReactNode;
}

/**
 * Swipe-left-to-delete for a list row, built on React Native's built-in
 * Animated/PanResponder rather than react-native-gesture-handler - this
 * app doesn't have that native module installed, and adding it means
 * another npm install + pod install + clean rebuild (the same class of
 * step as the icon font pod that was missing earlier), so this stays pure
 * JS with no new native dependency.
 */
export default function SwipeToDelete({ onDelete, children }: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const translateX = useRef(new Animated.Value(0)).current;
  const openRef = useRef(false);
  // Guards against both a double-tap on the delete button and the
  // PanResponder somehow firing release logic twice for one gesture -
  // either way, onDelete (which mutates the parent's list) must only ever
  // fire once per row.
  const deletedRef = useRef(false);

  const close = () => {
    openRef.current = false;
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
  };

  const open = () => {
    openRef.current = true;
    Animated.spring(translateX, { toValue: -DELETE_WIDTH, useNativeDriver: true }).start();
  };

  const deleteRow = () => {
    if (deletedRef.current) return;
    deletedRef.current = true;
    Animated.timing(translateX, {
      toValue: OFF_SCREEN,
      duration: 180,
      useNativeDriver: true,
    }).start(() => onDelete());
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
        // Only the right edge is clamped (can't drag past fully closed) -
        // the left side is intentionally unbounded so a full swipe can be
        // dragged past the delete button, same as the native gesture.
        translateX.setValue(Math.min(0, base + gesture.dx));
      },
      onPanResponderRelease: (_evt, gesture) => {
        const isTap = Math.abs(gesture.dx) < TAP_SLOP && Math.abs(gesture.dy) < TAP_SLOP;
        if (isTap && openRef.current) {
          close();
          return;
        }
        const base = openRef.current ? -DELETE_WIDTH : 0;
        const finalValue = base + gesture.dx;
        if (finalValue < FULL_SWIPE_THRESHOLD) {
          deleteRow();
        } else if (finalValue < SWIPE_OPEN_THRESHOLD) {
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
        <Pressable onPress={deleteRow} style={styles.deleteButton} hitSlop={8}>
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

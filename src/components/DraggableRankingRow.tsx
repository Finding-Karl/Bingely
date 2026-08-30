import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, GestureResponderEvent, PanResponder, StyleSheet, View } from 'react-native';
import { RankedItem } from '../types/models';
import { useAppTheme } from '../context/ThemeContext';
import { AppColors } from '../theme';
import RankingRow from './RankingRow';
import SwipeToDelete from './SwipeToDelete';

// How long a still touch has to be held before it arms as a drag, rather
// than being left alone for FlatList's scroll or SwipeToDelete's swipe to
// handle. Matches the "press and hold" the feature was asked for, rather
// than reordering on a quick flick.
const LONG_PRESS_MS = 350;
// A touch that moves more than this many px before the hold completes is
// almost certainly the start of a scroll or a swipe, not a deliberate
// long-press - cancel arming rather than let it fire mid-gesture.
const MOVE_CANCEL_THRESHOLD = 6;

interface Props {
  item: RankedItem;
  rank: number;
  isDragging: boolean;
  isSwappable: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  translateY: Animated.Value;
  onLayout: (height: number) => void;
  onDelete: () => void;
  onDragStart: (item: RankedItem) => void;
  onDragMove: (dy: number) => void;
  onDragEnd: () => void;
}

/**
 * One Dashboard row, wrapping the existing SwipeToDelete + RankingRow with
 * press-and-hold-to-reorder on top. Built on plain PanResponder/Animated
 * like SwipeToDelete already is (see that file's comment) rather than
 * react-native-gesture-handler, to avoid a second, unrelated native
 * dependency + rebuild for this app.
 *
 * The tricky part is coexisting with SwipeToDelete's own horizontal-swipe
 * PanResponder underneath: this component's responder never claims
 * anything at touch-down (onStartShouldSetPanResponder always false), and
 * only becomes eligible to claim a move (onMoveShouldSetPanResponder) once
 * a long-press has actually fired. Direct onTouchStart/Move/End handlers -
 * which fire regardless of who ends up owning the gesture - drive that
 * long-press timer and cancel it the moment any real movement happens
 * before it completes, so a normal swipe or scroll still reaches
 * SwipeToDelete/FlatList exactly as before; only a genuine hold-then-drag
 * ever reaches this component's own PanResponder.
 */
export default function DraggableRankingRow({
  item,
  rank,
  isDragging,
  isSwappable,
  isFirstInGroup,
  isLastInGroup,
  translateY,
  onLayout,
  onDelete,
  onDragStart,
  onDragMove,
  onDragEnd,
}: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // The PanResponder below is created once (useRef) and its handlers close
  // over whatever these props were at that first render - keeping the
  // latest values in refs, updated every render, is what lets the frozen
  // closures still call the current callback/item instead of a stale one.
  const itemRef = useRef(item);
  const onDragStartRef = useRef(onDragStart);
  const onDragMoveRef = useRef(onDragMove);
  const onDragEndRef = useRef(onDragEnd);
  useEffect(() => {
    itemRef.current = item;
    onDragStartRef.current = onDragStart;
    onDragMoveRef.current = onDragMove;
    onDragEndRef.current = onDragEnd;
  });

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStart = useRef({ x: 0, y: 0 });
  const armedRef = useRef(false);
  const startedRef = useRef(false);

  const clearLongPressTimer = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const finishDrag = () => {
    armedRef.current = false;
    if (startedRef.current) {
      startedRef.current = false;
      onDragEndRef.current();
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: () => armedRef.current,
      onPanResponderGrant: () => {
        startedRef.current = true;
        onDragStartRef.current(itemRef.current);
      },
      onPanResponderMove: (_evt, gesture) => {
        if (startedRef.current) onDragMoveRef.current(gesture.dy);
      },
      onPanResponderRelease: finishDrag,
      onPanResponderTerminate: finishDrag,
    }),
  ).current;

  const handleTouchStart = (e: GestureResponderEvent) => {
    clearLongPressTimer();
    armedRef.current = false;
    touchStart.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
    longPressTimer.current = setTimeout(() => {
      armedRef.current = true;
    }, LONG_PRESS_MS);
  };

  const handleTouchMove = (e: GestureResponderEvent) => {
    if (armedRef.current || startedRef.current) return;
    const dx = e.nativeEvent.pageX - touchStart.current.x;
    const dy = e.nativeEvent.pageY - touchStart.current.y;
    if (Math.hypot(dx, dy) > MOVE_CANCEL_THRESHOLD) {
      clearLongPressTimer();
    }
  };

  const handleTouchEnd = () => {
    clearLongPressTimer();
    if (!startedRef.current) {
      armedRef.current = false;
    }
  };

  return (
    <View
      onLayout={e => onLayout(e.nativeEvent.layout.height)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      {...panResponder.panHandlers}
    >
      <Animated.View
        style={[
          isSwappable && styles.swappable,
          isSwappable && isFirstInGroup && styles.swappableFirst,
          isSwappable && isLastInGroup && styles.swappableLast,
          isDragging && styles.dragging,
          { transform: [{ translateY: isDragging ? translateY : 0 }] },
        ]}
      >
        <SwipeToDelete onDelete={onDelete}>
          <RankingRow item={item} rank={rank} />
        </SwipeToDelete>
      </Animated.View>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    // The "soft boundary" around the group a dragged row can currently be
    // dropped into: a light tint through every row in the group, with a
    // slightly heavier accent border top-and-bottom marking where the
    // swappable range actually ends.
    swappable: {
      backgroundColor: colors.primaryMuted,
    },
    swappableFirst: {
      borderTopWidth: 2,
      borderTopColor: colors.primary,
    },
    swappableLast: {
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
    },
    dragging: {
      backgroundColor: colors.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 12,
      zIndex: 10,
    },
  });
}

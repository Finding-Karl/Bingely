import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  LayoutAnimation,
  Platform,
  RefreshControlProps,
  StyleProp,
  UIManager,
  ViewStyle,
} from 'react-native';
import { RankedItem } from '../types/models';
import DraggableRankingRow from './DraggableRankingRow';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Used only for a row that hasn't reported its measured height yet (should
// be rare - every currently-rendered row measures itself via onLayout
// before it's touchable) - close to a single-line row's real height so an
// early drag still feels reasonable before real measurements are in.
const DEFAULT_ROW_HEIGHT = 84;

interface Props {
  items: RankedItem[];
  onDelete: (item: RankedItem) => void;
  onReorder: (orderedIds: string[]) => void;
  // Opens TitleReviewsScreen for the tapped title - see DraggableRankingRow
  // for why this doesn't conflict with the swipe-to-delete/drag gestures.
  onPressItem?: (item: RankedItem) => void;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  ListEmptyComponent?: React.ComponentProps<typeof FlatList>['ListEmptyComponent'];
  contentContainerStyle?: StyleProp<ViewStyle>;
}

/**
 * The Dashboard's list of ranked titles, with press-and-hold drag-to-
 * reorder layered on top of the existing swipe-to-delete row. A dragged
 * row can only be dropped among its own same-score neighbors (the "tie
 * group" priority breaks ties within) - never above a higher-scored title
 * or below a lower-scored one - so this owns the bookkeeping for where
 * those group boundaries currently are, how far a drag has to travel to
 * cross into the next slot, and asking the list to actually swap once it
 * does.
 *
 * `items` is expected already sorted score DESC (then by priority - see
 * getRankings/rankings.ts), same as the backend returns it. Filtering
 * (e.g. the Dashboard's genre tabs) is fine to apply before passing items
 * in: it only ever removes rows, so same-score rows that remain stay
 * contiguous, which is all the group-boundary logic below depends on.
 */
export default function DraggableRankingList({
  items,
  onDelete,
  onReorder,
  onPressItem,
  refreshControl,
  ListEmptyComponent,
  contentContainerStyle,
}: Props) {
  const [liveOrder, setLiveOrder] = useState<RankedItem[] | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Mirrors `liveOrder` for synchronous reads from gesture callbacks -
  // reading state itself there would mean going through a setState
  // updater function, which React can invoke more than once (Strict Mode
  // double-invokes updaters to surface impure ones), and calling the
  // reorder API as a side effect of that would risk firing it twice.
  const liveOrderRef = useRef<RankedItem[] | null>(null);
  const rowHeights = useRef<Record<string, number>>({});
  // Signed sum of the heights of rows already "granted" to the dragged
  // row's position via a slot swap - subtracted back out of the raw
  // gesture delta so the row's on-screen position keeps tracking the
  // finger continuously across swaps instead of jumping by a row-height
  // each time (see handleDragMove).
  const crossedOffset = useRef(0);
  const translateY = useRef(new Animated.Value(0)).current;

  const draggingScore = useMemo(() => {
    if (!draggingId) return undefined;
    return (liveOrder ?? items).find(r => r.id === draggingId)?.score;
  }, [draggingId, liveOrder, items]);

  const handleDragStart = useCallback(
    (item: RankedItem) => {
      const snapshot = [...items];
      liveOrderRef.current = snapshot;
      crossedOffset.current = 0;
      translateY.setValue(0);
      setLiveOrder(snapshot);
      setDraggingId(item.id);
    },
    [items, translateY],
  );

  const handleDragMove = useCallback(
    (dy: number) => {
      const current = liveOrderRef.current;
      const id = draggingId;
      if (!current || !id) return;

      let idx = current.findIndex(r => r.id === id);
      if (idx === -1) return;
      const dragged = current[idx];

      let groupStart = idx;
      while (groupStart > 0 && current[groupStart - 1].score === dragged.score) groupStart--;
      let groupEnd = idx;
      while (groupEnd < current.length - 1 && current[groupEnd + 1].score === dragged.score) groupEnd++;

      let next = current;
      let offset = crossedOffset.current;
      let changed = false;

      // Walk downward (a loop, not a single step, so a fast drag that
      // clears more than one row in a single move event still lands in
      // the right slot instead of lagging a step behind).
      while (dy - offset > 0 && idx < groupEnd) {
        const below = next[idx + 1];
        const belowHeight = rowHeights.current[below.id] ?? DEFAULT_ROW_HEIGHT;
        if (dy - offset <= belowHeight / 2) break;
        if (!changed) next = [...next];
        [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
        offset += belowHeight;
        idx++;
        changed = true;
      }
      // ...and symmetrically upward.
      while (dy - offset < 0 && idx > groupStart) {
        const above = next[idx - 1];
        const aboveHeight = rowHeights.current[above.id] ?? DEFAULT_ROW_HEIGHT;
        if (offset - dy <= aboveHeight / 2) break;
        if (!changed) next = [...next];
        [next[idx], next[idx - 1]] = [next[idx - 1], next[idx]];
        offset -= aboveHeight;
        idx--;
        changed = true;
      }

      crossedOffset.current = offset;
      translateY.setValue(dy - offset);

      if (changed) {
        liveOrderRef.current = next;
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setLiveOrder(next);
      }
    },
    [draggingId, translateY],
  );

  const handleDragEnd = useCallback(() => {
    const current = liveOrderRef.current;
    const id = draggingId;
    if (current && id) {
      const dragged = current.find(r => r.id === id);
      if (dragged) {
        const groupIds = current.filter(r => r.score === dragged.score).map(r => r.id);
        onReorder(groupIds);
      }
    }
    liveOrderRef.current = null;
    crossedOffset.current = 0;
    translateY.setValue(0);
    setLiveOrder(null);
    setDraggingId(null);
  }, [draggingId, onReorder, translateY]);

  const displayItems = liveOrder ?? items;

  return (
    <FlatList
      data={displayItems}
      keyExtractor={item => item.id}
      scrollEnabled={draggingId === null}
      renderItem={({ item, index }) => {
        const isDragging = draggingId === item.id;
        const isSwappable = !isDragging && draggingScore !== undefined && item.score === draggingScore;
        const isFirstInGroup = isSwappable && (index === 0 || displayItems[index - 1].score !== item.score);
        const isLastInGroup =
          isSwappable && (index === displayItems.length - 1 || displayItems[index + 1].score !== item.score);
        return (
          <DraggableRankingRow
            item={item}
            rank={index + 1}
            isDragging={isDragging}
            isSwappable={isSwappable}
            isFirstInGroup={isFirstInGroup}
            isLastInGroup={isLastInGroup}
            translateY={translateY}
            onLayout={height => {
              rowHeights.current[item.id] = height;
            }}
            onDelete={() => onDelete(item)}
            onPress={onPressItem ? () => onPressItem(item) : undefined}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
          />
        );
      }}
      contentContainerStyle={[styles.listContent, contentContainerStyle]}
      refreshControl={refreshControl}
      ListEmptyComponent={ListEmptyComponent}
    />
  );
}

const styles = { listContent: { flexGrow: 1 as const } };

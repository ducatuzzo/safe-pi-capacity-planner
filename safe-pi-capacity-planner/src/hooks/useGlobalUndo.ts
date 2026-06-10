import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  Employee, PIPlanning, Feiertag, Schulferien, Blocker,
  FarbConfig, GlobalCapacityConfig, TeamConfig, PITeamTarget, CustomAllocationType,
} from '../types';

const STACK_LIMIT = 5;

export interface AppSnapshot {
  employees: Employee[];
  pis: PIPlanning[];
  feiertage: Feiertag[];
  schulferien: Schulferien[];
  blocker: Blocker[];
  globalConfig: GlobalCapacityConfig;
  teamConfigs: TeamConfig[];
  piTeamTargets: PITeamTarget[];
  farbConfig: FarbConfig;
  customAllocationTypes: CustomAllocationType[];
}

export interface GlobalUndoApi {
  pushSnapshot: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

interface UseGlobalUndoArgs {
  getCurrent: () => AppSnapshot;
  apply: (snapshot: AppSnapshot) => void;
}

export function useGlobalUndo({ getCurrent, apply }: UseGlobalUndoArgs): GlobalUndoApi {
  const undoStack = useRef<AppSnapshot[]>([]);
  const redoStack = useRef<AppSnapshot[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const refresh = useCallback(() => {
    setCanUndo(undoStack.current.length > 0);
    setCanRedo(redoStack.current.length > 0);
  }, []);

  const pushSnapshot = useCallback(() => {
    undoStack.current.push(getCurrent());
    if (undoStack.current.length > STACK_LIMIT) undoStack.current.shift();
    redoStack.current = [];
    refresh();
  }, [getCurrent, refresh]);

  const undo = useCallback(() => {
    const prev = undoStack.current.pop();
    if (!prev) return;
    redoStack.current.push(getCurrent());
    if (redoStack.current.length > STACK_LIMIT) redoStack.current.shift();
    apply(prev);
    refresh();
  }, [apply, getCurrent, refresh]);

  const redo = useCallback(() => {
    const next = redoStack.current.pop();
    if (!next) return;
    undoStack.current.push(getCurrent());
    if (undoStack.current.length > STACK_LIMIT) undoStack.current.shift();
    apply(next);
    refresh();
  }, [apply, getCurrent, refresh]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (target?.isContentEditable) return;
      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      else if ((key === 'y') || (key === 'z' && e.shiftKey)) { e.preventDefault(); redo(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  return { pushSnapshot, undo, redo, canUndo, canRedo };
}

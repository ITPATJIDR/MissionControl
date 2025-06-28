import { useState, useEffect, useCallback } from "react";
import { Todo } from "../types";
import { minutesToSeconds } from "../utils/timeUtils";

export const useTimer = (todos: Todo[], onTodoToggle: (id: number) => void) => {
  const [focusedTodo, setFocusedTodo] = useState<Todo | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0); // in seconds
  const [isPaused, setIsPaused] = useState(false);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (focusedTodo && remainingTime > 0 && !isPaused) {
      interval = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            // Timer finished - automatically move to next task
            handleSkip();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [focusedTodo, remainingTime, isPaused]);

  const handleFocus = useCallback((todo: Todo) => {
    setFocusedTodo(todo);
    setRemainingTime(minutesToSeconds(todo.time));
    setIsPaused(false);
  }, []);

  const handleSkip = useCallback(() => {
    // Find the next incomplete task after the current focused task
    const incompleteTodos = todos.filter(todo => !todo.completed);
    const currentIndex = incompleteTodos.findIndex(todo => todo.id === focusedTodo?.id);

    if (currentIndex < incompleteTodos.length - 1) {
      // Move to next task
      const nextTodo = incompleteTodos[currentIndex + 1];
      setFocusedTodo(nextTodo);
      setRemainingTime(minutesToSeconds(nextTodo.time));
      setIsPaused(false);
    } else if (incompleteTodos.length > 1) {
      // If at the end, go back to first task
      const firstTodo = incompleteTodos[0];
      setFocusedTodo(firstTodo);
      setRemainingTime(minutesToSeconds(firstTodo.time));
      setIsPaused(false);
    } else {
      // No more tasks, clear focus
      setFocusedTodo(null);
      setRemainingTime(0);
      setIsPaused(false);
      return 'exit_focus'; // Signal to exit focus mode
    }
  }, [todos, focusedTodo]);

  const handlePause = useCallback(() => {
    setIsPaused(!isPaused);
  }, [isPaused]);

  const handleDone = useCallback(() => {
    if (focusedTodo) {
      // Mark current task as completed
      onTodoToggle(focusedTodo.id);

      // Move to next incomplete task
      const incompleteTodos = todos.filter(todo => !todo.completed && todo.id !== focusedTodo.id);

      if (incompleteTodos.length > 0) {
        const nextTodo = incompleteTodos[0];
        setFocusedTodo(nextTodo);
        setRemainingTime(minutesToSeconds(nextTodo.time));
        setIsPaused(false);
      } else {
        // No more incomplete tasks, clear focus
        setFocusedTodo(null);
        setRemainingTime(0);
        setIsPaused(false);
        return 'exit_focus'; // Signal to exit focus mode
      }
    }
  }, [focusedTodo, todos, onTodoToggle]);

  const getFirstIncompleteTodo = useCallback(() => {
    return todos.find(todo => !todo.completed) || null;
  }, [todos]);

  const hasIncompleteTodos = useCallback(() => {
    return todos.some(todo => !todo.completed);
  }, [todos]);

  const resetTimer = useCallback(() => {
    setFocusedTodo(null);
    setRemainingTime(0);
    setIsPaused(false);
  }, []);

  return {
    focusedTodo,
    remainingTime,
    isPaused,
    handleFocus,
    handleSkip,
    handlePause,
    handleDone,
    getFirstIncompleteTodo,
    hasIncompleteTodos,
    resetTimer
  };
}; 
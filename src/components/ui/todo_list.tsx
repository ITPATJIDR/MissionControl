import AddTaskButton from "./add_task_button";
import TodoItem from "./todo_item";

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  time: number;
}

interface TodoListProps {
  todos: Todo[];
  onAddTodo: (text: string) => void;
  onDeleteTodo: (id: number) => void;
  onToggleTodo: (id: number) => void;
  onUpdateTodo: (id: number, newText: string, newTime?: number) => void;
  isAddingTask: boolean;
  setIsAddingTask: (value: boolean) => void;
}

const TodoList = ({ 
  todos, 
  onAddTodo, 
  onDeleteTodo, 
  onToggleTodo, 
  onUpdateTodo,
  isAddingTask,
  setIsAddingTask
}: TodoListProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-white font-bold text-lg">Tasks</h2>
      
      {/* Todo Items */}
      <div className="space-y-2">
        {todos.map(todo => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onDelete={onDeleteTodo}
            onToggle={onToggleTodo}
            onUpdate={onUpdateTodo}
          />
        ))}
      </div>

      {/* Add Task Button/Input */}
      <AddTaskButton 
        onAddTodo={onAddTodo}
        isAddingTask={isAddingTask}
        setIsAddingTask={setIsAddingTask}
      />
    </div>
  );
};

export default TodoList;

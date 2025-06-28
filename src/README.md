# Code Organization

This project has been reorganized into a clean, modular structure for better maintainability and reusability.

## 📁 Project Structure

```
src/
├── components/           # React components
│   ├── ui/              # Existing UI components (unchanged)
│   ├── ExcalidrawCanvas.tsx  # Excalidraw wrapper component
│   ├── MainLayout.tsx   # Main application layout
│   ├── Sidebar.tsx      # Sidebar component with projects/todos
│   └── index.ts         # Component exports
├── hooks/               # Custom React hooks
│   ├── useApp.ts        # Main application logic hook
│   ├── useExcalidraw.ts # Excalidraw state management
│   ├── useProjects.ts   # Project management
│   ├── useTimer.ts      # Timer and focus mode logic
│   ├── useTodos.ts      # Todo management
│   └── index.ts         # Hook exports
├── services/            # API and external services
│   └── api.ts           # Tauri API service layer
├── types/               # TypeScript type definitions
│   └── index.ts         # All app types
├── utils/               # Utility functions
│   ├── timeUtils.ts     # Time formatting utilities
│   └── index.ts         # Utility exports
└── App.tsx              # Main app component (simplified)
```

## 🎯 Key Improvements

### 1. **Separation of Concerns**
- **Components**: Pure UI components focused on rendering
- **Hooks**: Business logic and state management
- **Services**: API calls and external integrations
- **Types**: Centralized type definitions
- **Utils**: Reusable utility functions

### 2. **Custom Hooks**
- `useApp`: Main application orchestrator
- `useProjects`: Project CRUD operations
- `useTodos`: Todo management
- `useTimer`: Focus mode and timer logic
- `useExcalidraw`: Canvas state and auto-save

### 3. **Reusable Components**
- `MainLayout`: Main app layout structure
- `Sidebar`: Project selector and todo list
- `ExcalidrawCanvas`: Excalidraw wrapper with save status

### 4. **Service Layer**
- `apiService`: Centralized Tauri API calls
- Clean separation between UI and backend communication

## 🚀 Benefits

1. **Maintainability**: Each file has a single responsibility
2. **Reusability**: Hooks and components can be easily reused
3. **Testability**: Isolated logic is easier to unit test
4. **Readability**: Clear structure and smaller files
5. **Scalability**: Easy to add new features without affecting existing code

## 📖 Usage Examples

### Using Individual Hooks
```typescript
import { useProjects, useTodos } from './hooks';

const MyComponent = () => {
  const { projects, createProject } = useProjects();
  const { todos, addTodo } = useTodos();
  // ...
};
```

### Using Components
```typescript
import { MainLayout, Sidebar } from './components';

const App = () => {
  return (
    <MainLayout
      projects={projects}
      onProjectSelect={handleSelect}
      // ... other props
    />
  );
};
```

### Using Services
```typescript
import { apiService } from './services/api';

const createNewProject = async () => {
  const project = await apiService.createProject({
    name: 'New Project',
    description: 'Description'
  });
};
```

## 🔧 Migration Notes

- The main `App.tsx` is now much simpler and uses the `useApp` hook
- All business logic has been extracted into custom hooks
- API calls are centralized in the service layer
- Types are now shared across the application
- Components are focused on rendering and user interaction

This structure makes the codebase much more maintainable and follows React best practices. 
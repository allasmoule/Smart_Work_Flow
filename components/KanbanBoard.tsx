'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { TaskCard, TaskCardData } from './TaskCard';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { toast } from 'sonner';

type Status = 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED';

interface KanbanBoardProps {
  tasks: TaskCardData[];
  onTaskUpdate?: (taskId: string, status: Status) => Promise<void>;
  loading?: boolean;
}

const columns: { id: Status; title: string }[] = [
  { id: 'PENDING', title: 'Pending' },
  { id: 'IN_PROGRESS', title: 'In Progress' },
  { id: 'SUBMITTED', title: 'Submitted' },
  { id: 'APPROVED', title: 'Approved' },
];

export function KanbanBoard({ tasks, onTaskUpdate, loading }: KanbanBoardProps) {
  const [localTasks, setLocalTasks] = useState<TaskCardData[]>(tasks);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      setDraggedTaskId(null);
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      setDraggedTaskId(null);
      return;
    }

    const newStatus = destination.droppableId as Status;
    const task = localTasks.find(t => t.id === draggableId);

    if (!task || task.status === newStatus) {
      setDraggedTaskId(null);
      return;
    }

    // Optimistic update
    const previousTasks = [...localTasks];
    setLocalTasks(prev =>
      prev.map(t =>
        t.id === draggableId ? { ...t, status: newStatus } : t
      )
    );

    // Update on server
    if (onTaskUpdate) {
      try {
        await onTaskUpdate(draggableId, newStatus);
        toast.success('Task status updated');
      } catch (error) {
        // Rollback on error
        setLocalTasks(previousTasks);
        toast.error('Failed to update task status');
        console.error('Error updating task:', error);
      }
    }

    setDraggedTaskId(null);
  };

  const getTasksByStatus = (status: Status) =>
    localTasks.filter(t => t.status === status);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map(col => (
          <Card key={col.id}>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd} onDragStart={(start) => setDraggedTaskId(start.draggableId)}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map(column => {
          const columnTasks = getTasksByStatus(column.id);
          return (
            <Droppable key={column.id} droppableId={column.id}>
              {(provided, snapshot) => (
                <Card
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={snapshot.isDraggingOver ? 'bg-slate-50' : ''}
                >
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-slate-700">
                      {column.title}
                      <span className="ml-2 text-xs text-slate-500">
                        ({columnTasks.length})
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 min-h-[400px]">
                    {columnTasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={snapshot.isDragging ? 'opacity-50' : ''}
                          >
                            <TaskCard task={task} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </CardContent>
                </Card>
              )}
            </Droppable>
          );
        })}
      </div>
    </DragDropContext>
  );
}


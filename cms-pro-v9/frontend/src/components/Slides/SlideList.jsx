import React from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useCms } from '../../context/CmsContext';
import { api } from '../../api/client';
import SlideCard from './SlideCard';

export default function SlideList() {
  const { state, dispatch } = useCms();
  const slides = state.slides;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = slides.findIndex(s => s.id === active.id);
    const newIndex = slides.findIndex(s => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newSlides = [...slides];
    const [moved] = newSlides.splice(oldIndex, 1);
    newSlides.splice(newIndex, 0, moved);

    dispatch({ type: 'SET_SLIDES', payload: newSlides });

    try {
      await api.put('/slides/reorder', { ids: newSlides.map(s => s.id) });
    } catch (e) {
      console.error('Reorder error:', e);
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={slides.map(s => s.id)} strategy={verticalListSortingStrategy}>
        {slides.map((slide) => (
          <SlideCard key={slide.id} slide={slide} />
        ))}
      </SortableContext>
    </DndContext>
  );
}

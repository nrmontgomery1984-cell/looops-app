// Loop priority ranker with drag-and-drop reordering

import React from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import { LoopId, ALL_LOOPS } from "../../types";
import { LOOP_COLORS } from "../../types/core";

type LoopPriorityRankerProps = {
  ranking: LoopId[];
  onChange: (ranking: LoopId[]) => void;
};

export function LoopPriorityRanker({
  ranking,
  onChange,
}: LoopPriorityRankerProps) {
  // Ensure all loops are in the ranking
  const normalizedRanking =
    ranking.length === ALL_LOOPS.length
      ? ranking
      : [...ALL_LOOPS].sort((a, b) => {
          const aIndex = ranking.indexOf(a);
          const bIndex = ranking.indexOf(b);
          if (aIndex === -1 && bIndex === -1) return 0;
          if (aIndex === -1) return 1;
          if (bIndex === -1) return -1;
          return aIndex - bIndex;
        });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(normalizedRanking);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onChange(items);
  };

  return (
    <div className="loop-ranker">
      <div className="loop-ranker__instructions">
        Drag loops to reorder them from highest to lowest priority
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="loop-priority">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`loop-ranker__list ${snapshot.isDraggingOver ? "loop-ranker__list--dragging-over" : ""}`}
            >
              {normalizedRanking.map((loopId, index) => (
                <Draggable key={loopId} draggableId={loopId} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`loop-ranker__item ${snapshot.isDragging ? "loop-ranker__item--dragging" : ""}`}
                      style={{
                        ...provided.draggableProps.style,
                        borderLeftColor: LOOP_COLORS[loopId].border,
                      }}
                    >
                      <span className="loop-ranker__rank">{index + 1}</span>
                      <span className="loop-ranker__handle">&#9776;</span>
                      <span
                        className="loop-ranker__loop-name"
                        style={{ color: LOOP_COLORS[loopId].border }}
                      >
                        {loopId}
                      </span>
                      <span className="loop-ranker__priority-label">
                        {index === 0
                          ? "Highest"
                          : index === normalizedRanking.length - 1
                            ? "Lowest"
                            : ""}
                      </span>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}

export default LoopPriorityRanker;

import { useForm } from "react-hook-form";
import React, { useState } from "react";
import {
  DraggableProvided,
  DraggingStyle,
  Droppable,
  NotDraggingStyle,
} from "react-beautiful-dnd";
import styled from "styled-components";
import DragabbleCard from "./DragabbleCard";
import { IBoard, toDoState } from "../atoms";
import { useSetRecoilState } from "recoil";
import { saveDataToFirestore } from "../firebaseUtils";
import { auth } from "../firebase";

const Overlay = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  position: absolute;
  pointer-events: none;
  z-index: 1;

  & > * {
    pointer-events: all;
  }
`;

const Title = styled.div`
  display: block;
  font-size: 1.6rem;
  font-weight: 600;
  width: 16rem;
  height: 4.5rem;
  padding: 1.25rem;
  border-radius: 0.8rem 0.8rem 0 0;
  transition: background-color 0.3s, color 0.3s, box-shadow 0.3s, opacity 0.3s;
  user-select: none;

  & > h2 {
    width: 13.5rem;
    margin-top: 0.2rem;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    transition: width 0.3s;
  }

  &.background {
    background-color: ${(props) => props.theme.glassColor};
    backdrop-filter: blur(0.4rem);
    box-shadow: 0 0.1rem 0.2rem rgba(0, 0, 0, 0.15);
  }
`;
const Buttons = styled.div`
  display: flex;
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  align-items: center;
  gap: 0.2rem;
  color: ${(props) => props.theme.secondaryTextColor};
  transition: opacity 0.3s;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  width: 2rem;
  height: 2rem;
  background: none;
  border: none;
  padding: 0;
  border-radius: 0.2rem;
  color: ${(props) => props.theme.secondaryTextColor};
  transition: background-color 0.3s, color 0.3s, opacity 0.3s;

  &:hover,
  &:active,
  &:focus {
    cursor: pointer;
    background-color: ${(props) => props.theme.hoverButtonOverlayColor};
  }

  &:focus {
    opacity: 1;
    outline: 0.15rem solid ${(props) => props.theme.accentColor};
  }

  &:last-child {
    cursor: grab;
  }
`;

const Form = styled.form`
  width: 100%;
  height: 3.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  bottom: 0;
  transition: background-color 0.3s, color 0.3s, opacity 0.3s;

  & :focus {
    outline: 0.15rem solid ${(props) => props.theme.accentColor};
  }

  & > input {
    width: 100%;
    height: 100%;
    padding: 0 1.2rem;
    border: none;
    border-radius: 0 0 0.8rem 0.8rem;
    background-color: ${(props) => props.theme.cardColor};
    box-shadow: 0 -0.1rem 0.2rem rgba(0, 0, 0, 0.15);
    font-size: 1rem;
    font-weight: 500;
    color: ${(props) => props.theme.textColor};
    transition: background-color 0.3s, box-shadow 0.3s;
  }

  & > button {
    position: absolute;
    right: 0;
    width: 3.5rem;
    height: 3.5rem;
    background-color: transparent;
    border: none;
    border-radius: 0 0 0.8rem 0;
    font-size: 1.4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${(props) => props.theme.accentColor};
  }

  & > input:placeholder-shown + button {
    display: none;
  }
`;

const ToDos = styled.ul`
  display: flex;
  flex-direction: column;
  padding: 4.5rem 0.4rem 4rem 1rem;
  width: 100%;
  max-height: calc(100vh - 11rem);
  overflow-x: hidden;
  overflow-y: scroll;

  &::-webkit-scrollbar {
    width: 0.6rem;
  }

  &::-webkit-scrollbar-thumb {
    background-color: ${(props) => props.theme.scrollBarColor};
    border-radius: 0.3rem;
    background-clip: padding-box;
    border: 0.2rem solid transparent;
    transition: background-color 0.3s;
  }
`;
const Empty = styled.li`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(props) => props.theme.secondaryTextColor};
  font-size: 0.9rem;
  margin-top: 0.9rem;
  margin-bottom: 1.6rem;
  cursor: default;
  transition: color 0.3s;
  user-select: none;
`;

const Container = styled.div<{ isDraggingOver: boolean }>`
  display: flex;
  width: 16rem;
  max-height: calc(100vh - 8rem);
  position: relative;
  background-color: ${(props) =>
    props.isDraggingOver ? props.theme.accentColor : props.theme.boardColor};
  border-radius: 0.8rem;
  box-shadow: 0 0.3rem 0.6rem rgba(0, 0, 0, 0.15);
  margin: 0.5rem;
  transition: background-color 0.3s, box-shadow 0.3s;

  &.hovering {
    box-shadow: 0 0.6rem 1.2rem rgba(0, 0, 0, 0.25);
  }

  &:has(li.dragging) ${Title}.background, &.dragging ${Title}.background {
    opacity: 0;
  }

  &.dragging ${Title} {
    color: white;

    & > h2 {
      width: 13.5rem !important;
    }
  }

  &:has(li.dragging) ${Form}, &.dragging ${Form} {
    opacity: 0;
  }

  &:has(li.dragging) ${Empty}, &.dragging ${Empty} {
    opacity: 0;
  }

  &.dragging ${ToDos}::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.3);
  }

  &:has(li.dragging) ${Form}.end, &.dragging ${Form}.end {
    opacity: 0.5;

    & > input {
      background-color: transparent;
      box-shadow: none;

      &::placeholder {
        color: white;
      }
    }
  }

  &:not(:hover):not(:focus-within) ${Buttons}, &.dragging ${Buttons} {
    opacity: 0;
  }

  &:hover ${Title} > h2,
  &:focus-within ${Title} > h2 {
    width: 7.1rem;
  }
`;

interface IBoardProps {
  board: IBoard;
  parentProvided: DraggableProvided;
  isHovering: boolean;
  style: DraggingStyle | NotDraggingStyle;
}

interface IForm {
  toDo: string;
}

// // background-color
// const Area = styled.div<IAreaProps>`
//   background-color: ${(props) =>
//     props.isDraggingOver
//       ? "#60a3bc"
//       : props.isDraggingFromThis
//       ? "#636e72"
//       : "transparent"};
//   flex-grow: 1;
//   transition: background-color 0.3s ease-in-out;
//   padding: 20px;
// `;

function Board({ board, parentProvided, isHovering, style }: IBoardProps) {
  const setToDos = useSetRecoilState(toDoState);

  const [isScrolled, setIsScrolled] = useState(false);
  const [isEnd, setIsEnd] = useState(false);

  const { register, setValue, handleSubmit } = useForm<IForm>();

  const onScroll = (event: React.UIEvent<HTMLUListElement>) => {
    if (event.currentTarget.scrollTop > 0) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }

    if (
      event.currentTarget.scrollHeight - event.currentTarget.scrollTop ===
      event.currentTarget.clientHeight
    ) {
      setIsEnd(true);
    } else {
      setIsEnd(false);
    }
  };

  const onValid = ({ toDo }: IForm) => {
    if (toDo.trim() === "") {
      return;
    }

    const newToDo = {
      id: Date.now(),
      text: toDo,
    };

    setToDos((prev) => {
      const toDosCopy = [...prev];
      const boardIndex = prev.findIndex((b) => b.id === board.id);
      const boardCopy = { ...prev[boardIndex] };

      boardCopy.toDos = [...boardCopy.toDos, newToDo];
      toDosCopy.splice(boardIndex, 1, boardCopy);

      saveDataToFirestore(auth.currentUser, "trello-clone-to-dos", toDosCopy);

      return toDosCopy;
    });

    setValue("toDo", "");
  };

  const onEdit = () => {
    const newName = window
      .prompt(`Enter s new name [${board.title}] board`, board.title)
      ?.trim();

    if (newName !== null && newName !== undefined) {
      if (newName === "") {
        alert("Enter the name.");
        return;
      }

      if (newName === board.title) {
        return;
      }

      setToDos((prev) => {
        const toDosCopy = [...prev];
        const boardIndex = toDosCopy.findIndex((b) => b.id === board.id);
        const boardCopy = { ...toDosCopy[boardIndex] };

        boardCopy.title = newName;
        toDosCopy.splice(boardIndex, 1, boardCopy);

        saveDataToFirestore(auth.currentUser, "trello-clone-to-dos", toDosCopy);

        return toDosCopy;
      });
    }
  };

  const onDelete = () => {
    if (window.confirm(`Are you delete [${board.title}] board?`)) {
      setToDos((prev) => {
        const toDosCopy = [...prev];
        const boardIndex = toDosCopy.findIndex((b) => b.id === board.id);

        toDosCopy.splice(boardIndex, 1);

        saveDataToFirestore(auth.currentUser, "trello-clone-to-dos", toDosCopy);

        return toDosCopy;
      });
    }
  };

  return (
    <Droppable droppableId={"board-" + board.id} type="BOARD">
      {(provided, snapshot) => (
        <Container
          isDraggingOver={snapshot.isDraggingOver}
          className={`${snapshot.isDraggingOver ? "dragging" : ""} ${
            isHovering ? "hovering" : ""
          }`}
          ref={parentProvided.innerRef}
          {...parentProvided.draggableProps}
          style={style}
        >
          <Overlay>
            <Title className={isScrolled ? "background" : ""}>
              <h2>{board.title}</h2>
              <Buttons>
                <Button onClick={onEdit}>
                  <svg
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path d="m2.695 14.762-1.262 3.155a.5.5 0 0 0 .65.65l3.155-1.262a4 4 0 0 0 1.343-.886L17.5 5.501a2.121 2.121 0 0 0-3-3L3.58 13.419a4 4 0 0 0-.885 1.343Z" />
                  </svg>
                </Button>
                <Button onClick={onDelete}>
                  <svg
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                  </svg>
                </Button>
                <Button as="div" {...parentProvided.dragHandleProps}>
                  <svg
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      clipRule="evenodd"
                      fillRule="evenodd"
                      d="M6 4.75A.75.75 0 0 1 6.75 4h10.5a.75.75 0 0 1 0 1.5H6.75A.75.75 0 0 1 6 4.75ZM6 10a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H6.75A.75.75 0 0 1 6 10Zm0 5.25a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H6.75a.75.75 0 0 1-.75-.75ZM1.99 4.75a1 1 0 0 1 1-1H3a1 1 0 0 1 1 1v.01a1 1 0 0 1-1 1h-.01a1 1 0 0 1-1-1v-.01ZM1.99 15.25a1 1 0 0 1 1-1H3a1 1 0 0 1 1 1v.01a1 1 0 0 1-1 1h-.01a1 1 0 0 1-1-1v-.01ZM1.99 10a1 1 0 0 1 1-1H3a1 1 0 0 1 1 1v.01a1 1 0 0 1-1 1h-.01a1 1 0 0 1-1-1V10Z"
                    />
                  </svg>
                </Button>
              </Buttons>
            </Title>
            <Form
              className={isEnd ? "end" : ""}
              onSubmit={handleSubmit(onValid)}
            >
              <input
                {...register("toDo", { required: true })}
                type="text"
                placeholder={`add ${board.title}`}
              />
              <button>
                <svg
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                </svg>
              </button>
            </Form>
          </Overlay>
          <ToDos
            ref={provided.innerRef}
            {...provided.droppableProps}
            onScroll={onScroll}
          >
            {board.toDos.map((toDo, index) => (
              <DragabbleCard
                toDo={toDo}
                key={toDo.id}
                index={index}
                boardId={board.id}
              />
            ))}
            {board.toDos.length === 0 ? (
              <Empty>This board is empty</Empty>
            ) : null}
            {provided.placeholder}
          </ToDos>
        </Container>
      )}
    </Droppable>
  );
}
export default Board;

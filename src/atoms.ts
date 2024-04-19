import { collection, doc, onSnapshot } from "firebase/firestore";
import { atom } from "recoil";
import { db } from "./firebase";

export const isLightState = atom<boolean>({
  key: "isLight",
  default: window.matchMedia("(prefers-color-scheme: light)").matches
    ? true
    : false,
});

export interface IToDo {
  id: number;
  text: string;
  isDeleted?: boolean;
}

export interface IBoard {
  id: number;
  title: string;
  toDos: IToDo[];
  isDeleted?: boolean;
}

export interface DeletedCardInfo {
  id: number;
  boardId: number;
  text: string;
  deletionTime?: string;
  archiveTime?: string;
}

export const deletedBoardsState = atom<{ id: number; title: string }[]>({
  key: "deletedBoardsState",
  default: [],
});

export const archiveCardsState = atom<{ id: number; title: string }[]>({
  key: "archiveCardsState",
  default: [],
});

export const boardTitlesState = atom<{ id: number; title: string }[]>({
  key: "boardTitles",
  default: [],
});

export const homeBoardState = atom<IToDo[]>({
  key: "homeBoardState",
  default: [],
});

/* const instanceOfToDo = (object: unknown): object is IToDo => {
  return (
    object !== null &&
    object !== undefined &&
    object.constructor === Object &&
    typeof (object as { id: unknown; text: unknown }).id === "number" &&
    typeof (object as { id: unknown; text: unknown }).text === "string"
  );
}; */

/* const instanceOfBoard = (object: unknown): object is IBoard => {
  return (
    object !== null &&
    object !== undefined &&
    object.constructor === Object &&
    typeof (object as { id: unknown; title: unknown; toDos: unknown }).id ===
      "number" &&
    typeof (object as { id: unknown; title: unknown; toDos: unknown }).title ===
      "string" &&
    Array.isArray(
      (object as { id: unknown; title: unknown; toDos: unknown }).toDos
    ) &&
    (object as { id: unknown; title: unknown; toDos: unknown[] }).toDos.every(
      (toDo) => instanceOfToDo(toDo)
    )
  );
}; */

/* const instanceOfBoards = (object: unknown): object is IBoard[] => {
  return (
    Array.isArray(object) && object.every((board) => instanceOfBoard(board))
  );
}; */

/* const localStorageEffect =
  (key: string) =>
  ({ setSelf, onSet }: any) => {
    const savedValue = localStorage.getItem(key);

    if (savedValue !== null && savedValue !== undefined) {
      const json = (raw: string) => {
        try {
          return JSON.parse(raw);
        } catch (error) {
          return false;
        }
      };

      if (json(savedValue) && instanceOfBoards(json(savedValue))) {
        setSelf(json(savedValue));
      }
    }

    onSet((newValue: IBoard[]) => {
      localStorage.setItem(key, JSON.stringify(newValue));
    });
  }; */

export const toDoState = atom<IBoard[]>({
  key: "toDos",
  default: [
    {
      title: "To Do",
      id: 0,
      toDos: [],
    },
    {
      title: "Doing",
      id: 1,
      toDos: [],
    },
    {
      title: "Done",
      id: 2,
      toDos: [],
    },
  ],
  effects_UNSTABLE: [
    ({ setSelf }) => {
      const unsubscribe = onSnapshot(
        doc(db, "kanbans", "trello-clone-to-dos"),
        (snapshot) => {
          const data = snapshot.exists() ? snapshot.data() : null;
          if (data) {
            setSelf([data] as IBoard[]);
          }
        }
      );
      return () => unsubscribe();
    },
  ],
});

/* const deletedCardsLocalStorageEffect =
  (key: string) =>
  ({ setSelf, onSet }: any) => {
    const savedValue = localStorage.getItem(key);

    if (savedValue !== null && savedValue !== undefined) {
      const json = (raw: string) => {
        try {
          return JSON.parse(raw);
        } catch (error) {
          return false;
        }
      };

      if (json(savedValue) && Array.isArray(json(savedValue))) {
        setSelf(json(savedValue));
      }
    }

    onSet((newValue: DeletedCardInfo[]) => {
      localStorage.setItem(key, JSON.stringify(newValue));
    });
  }; */

export const deletedCardsFirestoreEffect = ({ setSelf }: any) => {
  const unsubscribe = onSnapshot(doc(db, "deleted-cards"), (doc) => {
    const data = doc.exists() ? (doc.data() as DeletedCardInfo) : null;
    if (data) {
      setSelf([data]);
    }
  });

  return () => unsubscribe();
};

export const deletedCardsState = atom<DeletedCardInfo[]>({
  key: "deletedCardsState",
  default: [],
  effects_UNSTABLE: [deletedCardsFirestoreEffect("deleted-cards")],
});

/* const deletedArchiveFirestoreEffect =
(key: string) =>
({ setSelf, onSet }: any) => {
  const savedValue = localStorage.getItem(key);
  
  if (savedValue !== null && savedValue !== undefined) {
    const json = (raw: string) => {
      try {
        return JSON.parse(raw);
      } catch (error) {
        return false;
      }
    };
    
    if (json(savedValue) && Array.isArray(json(savedValue))) {
      setSelf(json(savedValue));
    }
  }
  
  onSet((newValue: DeletedCardInfo[]) => {
    localStorage.setItem(key, JSON.stringify(newValue));
  });
}; */
const deletedArchiveFirestoreEffect = ({ setSelf }: any) => {
  const unsubscribe = onSnapshot(
    collection(db, "archive-cards"),
    (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSelf(data);
    }
  );

  return () => unsubscribe();
};

export const deletedArchiveState = atom<DeletedCardInfo[]>({
  key: "deletedArchiveState",
  default: [],
  effects_UNSTABLE: [deletedArchiveFirestoreEffect("archive-cards")],
});

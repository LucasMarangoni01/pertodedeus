import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  deleteDoc, 
  serverTimestamp,
  addDoc,
  updateDoc
} from "firebase/firestore";
import { db } from "../lib/firebase";

export interface BibleMarker {
  id?: string;
  userId: string;
  book: string;
  chapter: number;
  verse: number;
  createdAt: any;
}

export interface BibleNote {
  id?: string;
  userId: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  createdAt: any;
  updatedAt: any;
}

/**
 * Serviço de Persistência Híbrida para a Bíblia
 * Suporta Firestore (Logado) e LocalStorage (Convidado)
 */

const LOCAL_STORAGE_MARKERS = 'perto_de_deus_marcadores';
const LOCAL_STORAGE_NOTES = 'perto_de_deus_notas';

// Helpers para LocalStorage
const getLocal = (key: string) => JSON.parse(localStorage.getItem(key) || '[]');
const setLocal = (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data));

/**
 * Alterna um marcador em um versículo.
 * Usa um ID único: livro_capitulo_versiculo
 */
export const marcarVersiculo = async (userId: string | null, book: string, chapter: number, verse: number) => {
  const markerId = `${book}_${chapter}_${verse}`;

  if (!userId) {
    // Lógica LocalStorage para Convidados
    const markers = getLocal(LOCAL_STORAGE_MARKERS);
    const index = markers.findIndex((m: any) => m.id === markerId);
    
    if (index > -1) {
      markers.splice(index, 1);
      setLocal(LOCAL_STORAGE_MARKERS, markers);
      return { action: 'removed' };
    } else {
      markers.push({ id: markerId, book, chapter, verse, createdAt: new Date().toISOString() });
      setLocal(LOCAL_STORAGE_MARKERS, markers);
      return { action: 'added' };
    }
  }

  // Lógica Firestore usando o ID único como ID do documento
  const markerRef = doc(db, `users/${userId}/marcadores`, markerId);
  const snapshot = await getDoc(markerRef);

  if (snapshot.exists()) {
    await deleteDoc(markerRef);
    return { action: 'removed', id: markerId };
  } else {
    const newMarker: BibleMarker = {
      userId,
      book,
      chapter,
      verse,
      createdAt: serverTimestamp()
    };
    await setDoc(markerRef, newMarker);
    return { action: 'added', id: markerId };
  }
};

/**
 * Salva ou atualiza uma nota em um versículo.
 */
export const salvarNota = async (userId: string | null, book: string, chapter: number, verse: number, text: string) => {
  const noteId = `${book}_${chapter}_${verse}`;

  if (!userId) {
    // Lógica LocalStorage
    const notes = getLocal(LOCAL_STORAGE_NOTES);
    const index = notes.findIndex((n: any) => n.id === noteId);
    
    if (index > -1) {
      notes[index] = { ...notes[index], text, updatedAt: new Date().toISOString() };
    } else {
      notes.push({ id: noteId, book, chapter, verse, text, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    setLocal(LOCAL_STORAGE_NOTES, notes);
    return { action: index > -1 ? 'updated' : 'created' };
  }

  // Lógica Firestore
  const noteRef = doc(db, `users/${userId}/notas`, noteId);
  const snapshot = await getDoc(noteRef);

  if (snapshot.exists()) {
    await updateDoc(noteRef, {
      text,
      updatedAt: serverTimestamp()
    });
    return { action: 'updated', id: noteId };
  } else {
    const newNote: BibleNote = {
      userId,
      book,
      chapter,
      verse,
      text,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await setDoc(noteRef, newNote);
    return { action: 'created', id: noteId };
  }
};

/**
 * Carrega todos os marcadores de um capítulo específico.
 */
export const carregarMarcadores = async (userId: string | null, book: string, chapter: number) => {
  if (!userId) {
    const markers = getLocal(LOCAL_STORAGE_MARKERS);
    return markers.filter((m: any) => m.book === book && m.chapter === chapter) as BibleMarker[];
  }

  const markerPath = `users/${userId}/marcadores`;
  const q = query(
    collection(db, markerPath),
    where("book", "==", book),
    where("chapter", "==", chapter)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BibleMarker));
};

/**
 * Carrega todas as notas de um capítulo específico.
 */
export const carregarNotas = async (userId: string | null, book: string, chapter: number) => {
  if (!userId) {
    const notes = getLocal(LOCAL_STORAGE_NOTES);
    return notes.filter((n: any) => n.book === book && n.chapter === chapter) as BibleNote[];
  }

  const notesPath = `users/${userId}/notas`;
  const q = query(
    collection(db, notesPath),
    where("book", "==", book),
    where("chapter", "==", chapter)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BibleNote));
};

/**
 * Exclui uma nota.
 */
export const deleteNoteAction = async (userId: string | null, noteId?: string, book?: string, chapter?: number, verse?: number) => {
  if (!userId) {
    const notes = getLocal(LOCAL_STORAGE_NOTES);
    const filtered = notes.filter((n: any) => !(n.book === book && n.chapter === chapter && n.verse === verse));
    setLocal(LOCAL_STORAGE_NOTES, filtered);
    return;
  }

  if (noteId) {
    await deleteDoc(doc(db, `users/${userId}/notas`, noteId));
  }
};

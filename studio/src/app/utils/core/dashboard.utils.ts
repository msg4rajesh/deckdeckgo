import {v4 as uuid} from 'uuid';

import {Deck, Slide, DeckData, Doc, Paragraph, DocData} from '@deckdeckgo/editor';

import navStore, {NavDirection} from '../../stores/nav.store';

import {ImportData, importEditorData, importEditorSync} from '../editor/import.utils';

import {getSlide} from '../../providers/data/slide/slide.provider';
import {removeSyncBeforeUnload} from './before-unload.utils';
import {getParagraph} from '../../providers/data/paragraph/paragraph.provider';

export type DeckOrDoc = {deck: Deck; doc?: never} | {doc: Doc; deck?: never};

export const clone = async (data: DeckOrDoc) => {
  const importData: ImportData = (await cloneDeck(data)) || (await cloneDoc(data));

  await importEditorData(importData);

  // Add new data to list of data to sync
  await importEditorSync(importData);
};

const cloneDeck = async ({deck}: DeckOrDoc): Promise<ImportData | undefined> => {
  if (!deck) {
    return undefined;
  }

  const cloneDeck: Deck = cloneDeckData(deck);

  const promises: Promise<Slide>[] | undefined = deck.data.slides?.map((slideId: string) => getSlide(deck.id, slideId));
  const slides: Slide[] = await Promise.all(promises || []);

  const cloneSlides: Slide[] = slides.map((slide: Slide) => ({
    ...slide,
    id: uuid()
  }));

  cloneDeck.data.slides = cloneSlides.map(({id}: Slide) => id);

  return {
    id: cloneDeck.id,
    deck: cloneDeck,
    slides: cloneSlides
  };
};

const cloneDoc = async ({doc}: DeckOrDoc): Promise<ImportData | undefined> => {
  if (!doc) {
    return undefined;
  }

  const cloneDoc: Doc = cloneDocData(doc);

  const promises: Promise<Paragraph>[] | undefined = doc.data.paragraphs?.map((paragraphId: string) =>
    getParagraph({docId: doc.id, paragraphId})
  );
  const paragraphs: Paragraph[] = await Promise.all(promises || []);

  const cloneParagraphs: Paragraph[] = paragraphs.map((paragraph: Paragraph) => ({
    ...paragraph,
    id: uuid()
  }));

  cloneDoc.data.paragraphs = cloneParagraphs.map(({id}: Paragraph) => id);

  return {
    id: cloneDoc.id,
    doc: cloneDoc,
    paragraphs: cloneParagraphs
  };
};

const cloneDeckData = (deck: Deck): Deck => {
  let clone: DeckData = {...deck.data};

  delete clone['slides'];
  delete clone['api_id'];
  delete clone['meta'];
  delete clone['deploy'];
  delete clone['github'];

  const now: Date = new Date();

  return {
    id: uuid(),
    data: {
      ...clone,
      updated_at: now,
      created_at: now
    }
  };
};

const cloneDocData = (doc: Doc): Doc => {
  let clone: DocData = {...doc.data};

  delete clone['paragraphs'];
  delete clone['meta'];

  const now: Date = new Date();

  return {
    id: uuid(),
    data: {
      ...clone,
      updated_at: now,
      created_at: now
    }
  };
};

export const loadAndImportDeck = (deck: Deck): Promise<void> => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      const promises: Promise<Slide>[] | undefined = deck.data.slides?.map((slideId: string) => getSlide(deck.id, slideId));
      const slides: Slide[] = await Promise.all(promises || []);

      await importEditorData({
        id: deck.id,
        deck,
        slides
      });

      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

export const loadAndImportDoc = (doc: Doc): Promise<void> => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      const promises: Promise<Paragraph>[] | undefined = doc.data.paragraphs?.map((paragraphId: string) =>
        getParagraph({
          docId: doc.id,
          paragraphId
        })
      );
      const paragraphs: Paragraph[] = await Promise.all(promises || []);

      await importEditorData({
        id: doc.id,
        doc,
        paragraphs
      });

      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

export const navigateReloadEditor = () => {
  // We are aware a sync is going to happen and we are navigating programmatically
  removeSyncBeforeUnload();

  navStore.state.nav = {
    url: '/',
    direction: NavDirection.RELOAD
  };
};

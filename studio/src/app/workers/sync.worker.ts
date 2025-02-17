import {get, getMany} from 'idb-keyval';

import {
  Deck,
  Doc,
  Paragraph,
  Slide,
  SyncData,
  SyncDataDeck,
  SyncDataDoc,
  SyncDataParagraph,
  SyncDataSlide,
  SyncPending,
  SyncPendingData,
  SyncPendingDeck,
  SyncPendingDoc,
  SyncPendingParagraph,
  SyncPendingSlide
} from '@deckdeckgo/editor';

// TODO: move Firestore merge to worker

let timer: NodeJS.Timeout = undefined;

export const startSyncTimer = async () => {
  timer = setInterval(async () => await syncData(), 5000);
};

export const stopSyncTimer = async () => {
  if (!timer) {
    return;
  }

  await syncData();

  clearInterval(timer);
  timer = undefined;
};

// TODO: there is probably a way to refactor these functions with the help of generic or the abstract interface...

const syncData = async () => {
  // TODO: Avoid atomic errors, window updating while worker running. If we can move Firestore and ICP to the worker it solves everything though.

  const data: SyncData | undefined = await collectData();

  // Do not stress window side if there are no data to sync
  if (!data) {
    return;
  }

  const {updateDecks, deleteDecks, deleteSlides, updateSlides, updateDocs, deleteDocs, deleteParagraphs, updateParagraphs} = data;

  if (
    updateDecks?.length === 0 &&
    deleteDecks?.length === 0 &&
    deleteSlides?.length === 0 &&
    updateSlides?.length === 0 &&
    updateDocs?.length === 0 &&
    deleteDocs?.length === 0 &&
    deleteParagraphs?.length === 0 &&
    updateParagraphs?.length === 0
  ) {
    return;
  }

  // @ts-ignore
  postMessage({
    msg: 'deckdeckgo_sync',
    data
  });
};

const collectData = async (): Promise<SyncData | undefined> => {
  const data: SyncPending | undefined = await get<SyncPending>('deckdeckgo_pending_sync');

  if (!data) {
    return undefined;
  }

  const syncedAt: Date = new Date();

  const decksData: Partial<SyncData> = await collectDecksData(data);
  const docsData: Partial<SyncData> = await collectDocsData(data);

  return {
    ...decksData,
    ...docsData,
    syncedAt
  } as SyncData;
};

const collectDecksData = async (data: SyncPending): Promise<Partial<SyncData>> => {
  const updateDecks: SyncDataDeck[] | undefined = (
    await getMany(uniqueSyncData(data.updateDecks).map(({key}: SyncPendingDeck) => key))
  ).map((deck: Deck) => ({
    deckId: deck.id,
    deck
  }));

  const deleteDecks: SyncDataDeck[] | undefined = uniqueSyncData(data.deleteDecks).map(({deckId}: SyncPendingDeck) => ({deckId}));

  const updateSlides: SyncDataSlide[] | undefined = await Promise.all(
    uniqueSyncData(data.updateSlides).map((slide: SyncPendingSlide) => getSlide(slide))
  );

  const deleteSlides: SyncDataSlide[] | undefined = uniqueSyncData(data.deleteSlides).map(({deckId, slideId}: SyncPendingSlide) => ({
    deckId,
    slideId
  }));

  return {
    updateDecks: deleteDecks
      ? updateDecks?.filter(
          ({deckId}: SyncDataDeck) => !deleteDecks.find(({deckId: deleteDeckId}: SyncDataDeck) => deleteDeckId === deckId)
        )
      : updateDecks,
    deleteDecks,
    updateSlides: deleteSlides
      ? updateSlides?.filter(
          ({slideId}: SyncDataSlide) => !deleteSlides.find(({slideId: deleteSlideId}: SyncDataSlide) => deleteSlideId === slideId)
        )
      : updateSlides,
    deleteSlides
  };
};

const collectDocsData = async (data: SyncPending): Promise<Partial<SyncData>> => {
  const updateDocs: SyncDataDoc[] | undefined = (await getMany(uniqueSyncData(data.updateDocs).map(({key}: SyncPendingDoc) => key))).map(
    (doc: Doc) => ({
      docId: doc.id,
      doc
    })
  );

  const deleteDocs: SyncDataDoc[] | undefined = uniqueSyncData(data.deleteDocs).map(({docId}: SyncPendingDoc) => ({docId}));

  const updateParagraphs: SyncDataParagraph[] | undefined = await Promise.all(
    uniqueSyncData(data.updateParagraphs).map((paragraph: SyncPendingParagraph) => getParagraph(paragraph))
  );

  const deleteParagraphs: SyncDataParagraph[] | undefined = uniqueSyncData(data.deleteParagraphs).map(
    ({docId, paragraphId}: SyncPendingParagraph) => ({
      docId,
      paragraphId
    })
  );

  return {
    updateDocs: deleteDocs
      ? updateDocs?.filter(({docId}: SyncDataDoc) => !deleteDocs.find(({docId: deleteDocId}: SyncDataDoc) => deleteDocId === docId))
      : updateDocs,
    deleteDocs,
    updateParagraphs: deleteParagraphs
      ? updateParagraphs?.filter(
          ({paragraphId}: SyncDataParagraph) =>
            !deleteParagraphs.find(({paragraphId: deleteParagraphId}: SyncDataParagraph) => deleteParagraphId === paragraphId)
        )
      : updateParagraphs,
    deleteParagraphs
  };
};

const getSlide = async ({deckId, slideId, key}: SyncPendingSlide): Promise<SyncDataSlide> => {
  const slide: Slide | undefined = await get(key);

  return {
    deckId,
    slideId,
    slide
  };
};

const getParagraph = async ({docId, paragraphId, key}: SyncPendingParagraph): Promise<SyncDataParagraph> => {
  const paragraph: Paragraph | undefined = await get(key);

  return {
    docId,
    paragraphId,
    paragraph
  };
};

const uniqueSyncData = (data: SyncPendingData[] | undefined): SyncPendingData[] => {
  return (data || []).reduce((acc: SyncPendingData[], curr: SyncPendingData) => {
    const index: number = acc.findIndex(({key}: SyncPendingData) => key === curr.key);

    if (index === -1) {
      acc.push(curr);
    } else if (acc[index].queuedAt.getTime() > curr.queuedAt.getTime()) {
      acc[index] = curr;
    }

    return acc;
  }, []);
};

import {set, get} from 'idb-keyval';

import {v4 as uuid} from 'uuid';

import {Doc, DocData} from '@deckdeckgo/editor';

import {syncUpdateDoc} from '../../../utils/editor/sync.utils';

export const createOfflineDoc = (docData: DocData): Promise<Doc> => {
  return new Promise<Doc>(async (resolve, reject) => {
    try {
      const docId: string = uuid();

      const now: Date = new Date();

      const doc: Doc = {
        id: docId,
        data: {
          ...docData,
          updated_at: now,
          created_at: now
        }
      };

      await set(`/docs/${docId}`, doc);

      await syncUpdateDoc(docId);

      resolve(doc);
    } catch (err) {
      reject(err);
    }
  });
};

export const getOfflineDoc = (docId: string): Promise<Doc> => {
  return get(`/docs/${docId}`);
};

export const updateOfflineDoc = (doc: Doc): Promise<Doc> => {
  return new Promise<Doc>(async (resolve, reject) => {
    try {
      if (!doc || !doc.data) {
        reject('Invalid doc data');
        return;
      }

      doc.data.updated_at = new Date();

      await set(`/docs/${doc.id}`, doc);

      await syncUpdateDoc(doc.id);

      resolve(doc);
    } catch (err) {
      reject(err);
    }
  });
};

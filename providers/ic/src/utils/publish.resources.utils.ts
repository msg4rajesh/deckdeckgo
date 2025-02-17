import {Deck} from '@deckdeckgo/editor';

import {_SERVICE as StorageBucketActor, AssetKey, HeaderField} from '../canisters/storage/storage.did';

import {toNullable} from './did.utils';
import {getStorageActor, upload} from './storage.utils';
import {BucketActor} from './manager.utils';

type KitMimeType = 'text/javascript' | 'text/plain' | 'application/manifest+json' | 'text/css';

interface Kit {
  src: string;
  filename: string;
  mimeType: KitMimeType;
  headers: HeaderField[];
  updateContent?: ({content, deck}: {deck: Deck; content: string}) => string;
}

const kitPath: string = 'https://raw.githubusercontent.com/deckgo/ic-kit/main/dist';

const kit: Kit[] = [
  {
    src: `${kitPath}/workbox-c837f436.js`,
    mimeType: 'text/javascript'
  },
  {
    src: `${kitPath}/service-worker.js`,
    mimeType: 'text/javascript'
  },
  {
    src: `${kitPath}/robots.txt`,
    mimeType: 'text/plain'
  },
  {
    src: `${kitPath}/manifest.webmanifest`,
    mimeType: 'application/manifest+json',
    updateContent: ({content, deck}: {deck: Deck; content: string}) =>
      content.replace('{{DECKDECKGO_AUTHOR}}', deck.data.meta?.author?.name || 'DeckDeckGo')
  },
  {
    src: `${kitPath}/build/index.css`,
    mimeType: 'text/css'
  },
  {
    src: `${kitPath}/build/index-KEIQ3UJL.js`,
    mimeType: 'text/javascript'
  },
  {
    src: `${kitPath}/build/deck/index-Q2TQ3TUD.js`,
    mimeType: 'text/javascript'
  },
  {
    src: `${kitPath}/build/deck/index.css`,
    mimeType: 'text/css'
  }
].map((resource: {src: string; mimeType: KitMimeType}) => {
  const {pathname}: URL = new URL(resource.src);
  return {
    ...resource,
    filename: pathname.split('/').pop(),
    headers: [['Cache-Control', 'max-age=31536000']]
  } as Kit;
});

export const uploadResources = async ({deck}: {deck: Deck}) => {
  // 1. Get actor
  const {actor}: BucketActor<StorageBucketActor> = await getStorageActor();

  const assetKeys: AssetKey[] = await actor.list(toNullable<string>('resources'));
  const keys: string[] = assetKeys.map(({name}: AssetKey) => name);

  // We only upload resources that have not been yet uploaded. In other words: we upload the resources the first time or if hashes are modified.
  const kitFiles: Kit[] = kit.filter(({filename}: Kit) => !keys.includes(filename));

  if (!kitFiles || kitFiles.length <= 0) {
    return;
  }

  const promises: Promise<void>[] = kitFiles.map((kit: Kit) => addKitIC({kit, actor, deck}));
  await Promise.all(promises);
};

const addKitIC = async ({kit, actor, deck}: {kit: Kit; actor: StorageBucketActor; deck: Deck}) => {
  const {src, filename, mimeType, updateContent, headers} = kit;

  const content: string = await downloadKit(src);

  const updatedContent: string = updateContent ? updateContent({content, deck}) : content;

  await uploadKit({filename, content: updatedContent, actor, mimeType, headers, fullPath: src.replace(kitPath, '')});
};

const uploadKit = async ({
  filename,
  fullPath,
  content,
  actor,
  mimeType,
  headers
}: {
  filename: string;
  fullPath: string;
  content: string;
  actor: StorageBucketActor;
  mimeType: KitMimeType;
  headers: HeaderField[];
}): Promise<void> => {
  await upload({
    data: new Blob([content], {type: mimeType}),
    filename,
    folder: 'resources',
    storageActor: actor,
    fullPath,
    headers
  });
};

const downloadKit = async (src: string): Promise<string> => {
  const htmlTemplate: Response = await fetch(src);
  return htmlTemplate.text();
};

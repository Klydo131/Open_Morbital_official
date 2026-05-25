// SPDX-License-Identifier: AGPL-3.0-or-later
declare module 'jsmediatags/dist/jsmediatags.min.js' {
  interface TagResult {
    type: string;
    tags: Record<string, unknown>;
  }

  interface ReadCallbacks {
    onSuccess: (result: TagResult) => void;
    onError: (error: unknown) => void;
  }

  const jsmediatags: {
    read: (file: File | string, callbacks: ReadCallbacks) => void;
  };

  export default jsmediatags;
}

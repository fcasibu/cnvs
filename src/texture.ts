import { fail } from './utils';

interface TextureConfigEntry {
  src: string;
  lazy: boolean;
  onProgress?: (progress: number) => void;
  onError?: (error: Error) => void;
}

type LoadingStatus = 'not_started' | 'loading' | 'completed' | 'error';

export class TextureManager {
  private entries = new Map<
    string,
    ImageBitmap | (() => Promise<ImageBitmap>)
  >();

  private loadErrors = new Map<string, Error>();
  private loadingStatus = new Map<string, LoadingStatus>();

  constructor(public readonly config: Record<string, TextureConfigEntry>) {
    for (const name of Object.keys(config)) {
      this.loadingStatus.set(name, 'not_started');
    }
  }

  public getStatus(name: string): LoadingStatus {
    const status = this.loadingStatus.get(name);
    fail(status, `Texture with name "${name}" is not configured`);

    return status;
  }

  public getError(name: string): Error | undefined {
    return this.loadErrors.get(name);
  }

  public async load(name: string): Promise<ImageBitmap> {
    const config = this.config[name];
    fail(config, `Texture with name "${name}" is not configured`);

    this.loadingStatus.set(name, 'loading');

    try {
      if (!config.lazy) {
        const bitmap = await this.loadBitmap(
          config.src,
          config.onProgress,
          config.onError,
        );

        this.entries.set(name, bitmap);
        this.loadingStatus.set(name, 'completed');

        return bitmap;
      }

      this.entries.set(name, () =>
        this.loadBitmap(config.src, config.onProgress, config.onError),
      );
      this.loadingStatus.set(name, 'completed');
      return this.get(name);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));

      this.loadErrors.set(name, error);
      this.loadingStatus.set(name, 'error');

      throw error;
    }
  }

  public async loadAll(): Promise<void> {
    const entries = Object.entries<TextureConfigEntry>(this.config);

    const promises = entries
      .filter(([, config]) => !config.lazy)
      .map(async ([name, config]) => {
        try {
          this.loadingStatus.set(name, 'loading');
          const bitmap = await this.loadBitmap(
            config.src,
            config.onProgress,
            config.onError,
          );

          this.entries.set(name, bitmap);
          this.loadingStatus.set(name, 'completed');
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));

          this.loadErrors.set(name, error);
          this.loadingStatus.set(name, 'error');

          if (config.onError) {
            config.onError(error);
          }
        }
      });

    for (const [name, config] of entries.filter(([, config]) => config.lazy)) {
      this.entries.set(name, () =>
        this.loadBitmap(config.src, config.onProgress, config.onError),
      );
      this.loadingStatus.set(name, 'not_started');
    }

    await Promise.all(promises);
  }

  public unloadAll() {
    for (const [, value] of this.entries) {
      if (value instanceof ImageBitmap) {
        value.close();
      }
    }

    this.entries.clear();
  }

  public async get(name: string): Promise<ImageBitmap> {
    const entry = this.entries.get(name);
    if (!entry) {
      fail(this.config[name], `Texture with name "${name}" is not registered`);

      return this.load(name);
    }

    if (entry instanceof ImageBitmap) return entry;

    try {
      this.loadingStatus.set(name, 'loading');

      const resolved = await entry();
      this.entries.set(name, resolved);
      this.loadingStatus.set(name, 'completed');

      return resolved;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));

      this.loadErrors.set(name, error);
      this.loadingStatus.set(name, 'error');

      const config = this.config[name];

      if (config && config.onError) {
        config.onError(error);
      }

      throw error;
    }
  }

  private async loadBitmap(
    src: string,
    onProgress?: (progress: number) => void,
    onError?: (error: Error) => void,
  ): Promise<ImageBitmap> {
    if (
      src.startsWith('http://') ||
      src.startsWith('https://') ||
      src.startsWith('//')
    ) {
      try {
        const response = await fetch(src);
        fail(response.ok, `Failed to fetch image: ${response.statusText}`);

        const total = Number(response.headers.get('content-length')) || 0;
        let loaded = 0;

        const reader = response.body?.getReader();
        fail(reader, 'Failed to get reader from response');

        const chunks: Uint8Array[] = [];
        let done = false;

        while (!done) {
          const { done: isDone, value } = await reader.read();
          done = isDone;

          if (!value) continue;

          chunks.push(value);
          loaded += value.length;

          if (onProgress && total > 0) {
            onProgress(loaded / total);
          }
        }

        const totalLength = chunks.reduce(
          (acc, chunk) => acc + chunk.length,
          0,
        );
        const data = new Uint8Array(totalLength);
        let position = 0;

        for (const chunk of chunks) {
          data.set(chunk, position);
          position += chunk.length;
        }

        const blob = new Blob([data], {
          type: response.headers.get('content-type') || 'image/png',
        });
        const img = await createImageBitmap(blob);

        if (onProgress) {
          onProgress(1);
        }

        return img;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));

        if (onError) {
          onError(error);
        }

        throw error;
      }
    } else {
      return new Promise<ImageBitmap>((resolve, reject) => {
        const img = new Image();

        img.onload = async () => {
          if (onProgress) {
            onProgress(1);
          }
          try {
            const bitmap = await createImageBitmap(img);

            resolve(bitmap);
          } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));

            if (onError) {
              onError(error);
            }

            reject(error);
          }
        };

        img.onerror = () => {
          const error = new Error(`Failed to load image: ${src}`);

          if (onError) {
            onError(error);
          }

          reject(error);
        };

        img.src = src;
      });
    }
  }
}

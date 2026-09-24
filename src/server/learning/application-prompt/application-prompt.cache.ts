export class ApplicationPromptCache {
  private readonly pending = new Map<string, Promise<{ promptVi: string; referenceEn: string }>>();

  getOrCreate(
    key: string,
    factory: () => Promise<{ promptVi: string; referenceEn: string }>,
  ): Promise<{ promptVi: string; referenceEn: string }> {
    const active = this.pending.get(key);
    if (active) return active;
    const request = factory().finally(() => this.pending.delete(key));
    this.pending.set(key, request);
    return request;
  }
}

export const applicationPromptCache = new ApplicationPromptCache();

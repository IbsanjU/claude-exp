import { IStreamingProvider } from './IStreamingProvider';
import { MockProvider } from './MockProvider';

let instance: IStreamingProvider | null = null;

export function getProvider(): IStreamingProvider {
  if (instance) return instance;

  const providerType = process.env.STREAMING_PROVIDER || 'mock';

  if (providerType === 'ivs') {
    const { IVSProvider } = require('./IVSProvider');
    instance = new IVSProvider();
    console.log('[streaming] Using IVS provider');
  } else {
    instance = new MockProvider();
    console.log('[streaming] Using mock provider (set STREAMING_PROVIDER=ivs for real AWS)');
  }

  return instance!;
}

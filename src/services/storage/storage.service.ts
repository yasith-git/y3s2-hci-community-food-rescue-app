/**
 * Supabase Storage Service for Food Photos
 * Community Food Rescue App
 */

import { supabase, isSupabaseConfigured } from '../supabase/client';
import { base64ToUint8Array } from '../profile/profile.service';

/**
 * Safely reads a local URI (file:// or content://) as an ArrayBuffer using
 * React Native's XMLHttpRequest, avoiding Expo fetch() which throws "bad URL" on native iOS.
 */
function readLocalUriAsArrayBuffer(uri: string): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.onload = () => {
        if (xhr.response) {
          resolve(xhr.response);
        } else {
          reject(new Error('Empty response from local file reader'));
        }
      };
      xhr.onerror = () => {
        reject(new Error('XMLHttpRequest failed to read local file'));
      };
      xhr.responseType = 'arraybuffer';
      xhr.open('GET', uri, true);
      xhr.send(null);
    } catch (e) {
      reject(e);
    }
  });
}

export async function uploadDonationImage(
  uri: string,
  userId: string,
  donationId: string
): Promise<string> {
  if (!uri) return uri;

  // Already a remote URL — nothing to upload
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return uri;
  }

  if (!isSupabaseConfigured || !supabase) {
    console.warn('[Storage] Supabase storage not configured; returning local uri.');
    return uri;
  }

  try {
    let arrayBuffer: ArrayBuffer | Uint8Array | null = null;
    let cleanExt = 'jpg';

    if (uri.startsWith('data:')) {
      const match = uri.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
      if (match) {
        cleanExt = match[1] === 'png' ? 'png' : 'jpg';
        arrayBuffer = base64ToUint8Array(match[2]);
      }
    } else {
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      cleanExt = fileExt.includes('?') ? fileExt.split('?')[0] : fileExt;
      cleanExt = cleanExt.replace(/[^a-z0-9]/gi, '') || 'jpg';

      try {
        arrayBuffer = await readLocalUriAsArrayBuffer(uri);
      } catch (readErr) {
        console.warn('[Storage] Local file read notice, preserving uri:', readErr);
        return uri;
      }
    }

    if (!arrayBuffer || (arrayBuffer as any).byteLength === 0) {
      return uri;
    }

    const storagePath = `${userId}/${donationId}_${Date.now()}.${cleanExt}`;

    const { error } = await supabase.storage
      .from('donation-images')
      .upload(storagePath, arrayBuffer, {
        contentType: cleanExt === 'png' ? 'image/png' : 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.warn('[Storage] Upload notice, falling back to empty image:', error.message);
      return uri.startsWith('http') ? uri : '';
    }

    const { data: publicUrlData } = supabase.storage
      .from('donation-images')
      .getPublicUrl(storagePath);

    return publicUrlData?.publicUrl || (uri.startsWith('http') ? uri : '');
  } catch (error) {
    console.warn('[Storage] Upload exception, falling back to empty image:', error);
    return uri.startsWith('http') ? uri : '';
  }
}

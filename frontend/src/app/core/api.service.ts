import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface UserMe {
  id: string;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
}

export interface ReleaseItem {
  id: string;
  title: string;
  releaseType: 'album' | 'single' | 'ep';
  releaseDate: string;
  artworkUrl: string | null;
  spotifyUrl: string;
  artists: { id: string; name: string }[];
}

export interface Profile {
  id: string;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  emailEnabled: boolean;
  notificationsEnabled: boolean;
  notificationMode: 'per_release' | 'digest';
  notificationEmail: string | null;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  followedArtistsCount: number;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBase;

  me() {
    return this.http.get<UserMe>(`${this.base}/auth/me`, {
      withCredentials: true,
    });
  }

  logout() {
    return this.http.post<{ ok: boolean }>(
      `${this.base}/auth/logout`,
      {},
      { withCredentials: true },
    );
  }

  spotifyLoginUrl(): string {
    return `${this.base}/auth/spotify`;
  }

  refreshSync() {
    return this.http.post<{ status: string; artists: number; releases: number }>(
      `${this.base}/sync/refresh`,
      {},
      { withCredentials: true },
    );
  }

  feedReleases(types: string[]) {
    let params = new HttpParams();
    if (types.length) params = params.set('types', types.join(','));
    return this.http.get<{ releases: ReleaseItem[] }>(
      `${this.base}/feed/releases`,
      { params, withCredentials: true },
    );
  }

  feedCalendar(types: string[]) {
    let params = new HttpParams();
    if (types.length) params = params.set('types', types.join(','));
    return this.http.get<{
      days: { date: string; releases: ReleaseItem[] }[];
    }>(`${this.base}/feed/calendar`, { params, withCredentials: true });
  }

  getProfile() {
    return this.http.get<Profile>(`${this.base}/profile`, {
      withCredentials: true,
    });
  }

  updatePreferences(body: {
    notificationsEnabled?: boolean;
    notificationMode?: 'per_release' | 'digest';
    notificationEmail?: string;
  }) {
    return this.http.put<Profile>(`${this.base}/profile/preferences`, body, {
      withCredentials: true,
    });
  }
}

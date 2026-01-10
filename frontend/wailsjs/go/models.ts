export namespace http {
	
	export class Client {
	    Transport: any;
	    Jar: any;
	    Timeout: number;
	
	    static createFrom(source: any = {}) {
	        return new Client(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Transport = source["Transport"];
	        this.Jar = source["Jar"];
	        this.Timeout = source["Timeout"];
	    }
	}

}

export namespace models {
	
	export class BiliAudio {
	    url: string;
	    expiresAt: time.Time;
	    fromCache: boolean;
	    title: string;
	    format: string;
	    cover: string;
	    duration: number;
	    author: string;
	
	    static createFrom(source: any = {}) {
	        return new BiliAudio(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.url = source["url"];
	        this.expiresAt = this.convertValues(source["expiresAt"], time.Time);
	        this.fromCache = source["fromCache"];
	        this.title = source["title"];
	        this.format = source["format"];
	        this.cover = source["cover"];
	        this.duration = source["duration"];
	        this.author = source["author"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class BiliFavoriteCollection {
	    id: number;
	    title: string;
	    count: number;
	    cover: string;
	
	    static createFrom(source: any = {}) {
	        return new BiliFavoriteCollection(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	        this.count = source["count"];
	        this.cover = source["cover"];
	    }
	}
	export class BiliFavoriteInfo {
	    bvid: string;
	    title: string;
	    cover: string;
	
	    static createFrom(source: any = {}) {
	        return new BiliFavoriteInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.bvid = source["bvid"];
	        this.title = source["title"];
	        this.cover = source["cover"];
	    }
	}
	export class SongRef {
	    id: number;
	    favoriteId: string;
	    songId: string;
	
	    static createFrom(source: any = {}) {
	        return new SongRef(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.favoriteId = source["favoriteId"];
	        this.songId = source["songId"];
	    }
	}
	export class Favorite {
	    id: string;
	    title: string;
	    songIds: SongRef[];
	    createdAt: time.Time;
	    updatedAt: time.Time;
	
	    static createFrom(source: any = {}) {
	        return new Favorite(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	        this.songIds = this.convertValues(source["songIds"], SongRef);
	        this.createdAt = this.convertValues(source["createdAt"], time.Time);
	        this.updatedAt = this.convertValues(source["updatedAt"], time.Time);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class LyricMapping {
	    id: string;
	    lyric: string;
	    offsetMs: number;
	    updatedAt: time.Time;
	
	    static createFrom(source: any = {}) {
	        return new LyricMapping(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.lyric = source["lyric"];
	        this.offsetMs = source["offsetMs"];
	        this.updatedAt = this.convertValues(source["updatedAt"], time.Time);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class PlayerSetting {
	    id: number;
	    config: Record<string, any>;
	    updatedAt: time.Time;
	
	    static createFrom(source: any = {}) {
	        return new PlayerSetting(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.config = source["config"];
	        this.updatedAt = this.convertValues(source["updatedAt"], time.Time);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Playlist {
	    id: number;
	    queue: string;
	    currentIndex: number;
	    updatedAt: time.Time;
	
	    static createFrom(source: any = {}) {
	        return new Playlist(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.queue = source["queue"];
	        this.currentIndex = source["currentIndex"];
	        this.updatedAt = this.convertValues(source["updatedAt"], time.Time);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Song {
	    id: string;
	    bvid: string;
	    name: string;
	    singer: string;
	    singerId: string;
	    cover: string;
	    coverLocal: string;
	    sourceId: string;
	    streamUrl: string;
	    streamUrlExpiresAt: time.Time;
	    lyric: string;
	    lyricOffset: number;
	    skipStartTime: number;
	    skipEndTime: number;
	    pageNumber: number;
	    pageTitle: string;
	    videoTitle: string;
	    totalPages: number;
	    createdAt: time.Time;
	    updatedAt: time.Time;
	
	    static createFrom(source: any = {}) {
	        return new Song(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.bvid = source["bvid"];
	        this.name = source["name"];
	        this.singer = source["singer"];
	        this.singerId = source["singerId"];
	        this.cover = source["cover"];
	        this.coverLocal = source["coverLocal"];
	        this.sourceId = source["sourceId"];
	        this.streamUrl = source["streamUrl"];
	        this.streamUrlExpiresAt = this.convertValues(source["streamUrlExpiresAt"], time.Time);
	        this.lyric = source["lyric"];
	        this.lyricOffset = source["lyricOffset"];
	        this.skipStartTime = source["skipStartTime"];
	        this.skipEndTime = source["skipEndTime"];
	        this.pageNumber = source["pageNumber"];
	        this.pageTitle = source["pageTitle"];
	        this.videoTitle = source["videoTitle"];
	        this.totalPages = source["totalPages"];
	        this.createdAt = this.convertValues(source["createdAt"], time.Time);
	        this.updatedAt = this.convertValues(source["updatedAt"], time.Time);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class Theme {
	    id: string;
	    name: string;
	    data: string;
	    isDefault: boolean;
	    isReadOnly: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Theme(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.data = source["data"];
	        this.isDefault = source["isDefault"];
	        this.isReadOnly = source["isReadOnly"];
	    }
	}

}

export namespace services {
	
	export class ExportData {
	    songs: models.Song[];
	    favorites: models.Favorite[];
	    settings: models.PlayerSetting;
	    lyrics: models.LyricMapping[];
	
	    static createFrom(source: any = {}) {
	        return new ExportData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.songs = this.convertValues(source["songs"], models.Song);
	        this.favorites = this.convertValues(source["favorites"], models.Favorite);
	        this.settings = this.convertValues(source["settings"], models.PlayerSetting);
	        this.lyrics = this.convertValues(source["lyrics"], models.LyricMapping);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class LoginPollResponse {
	    loggedIn: boolean;
	    message: string;
	
	    static createFrom(source: any = {}) {
	        return new LoginPollResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.loggedIn = source["loggedIn"];
	        this.message = source["message"];
	    }
	}
	export class PlayHistory {
	    favoriteId: string;
	    songId: string;
	    timestamp: number;
	
	    static createFrom(source: any = {}) {
	        return new PlayHistory(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.favoriteId = source["favoriteId"];
	        this.songId = source["songId"];
	        this.timestamp = source["timestamp"];
	    }
	}
	export class PlayInfo {
	    RawURL: string;
	    ProxyURL: string;
	    ExpiresAt: time.Time;
	    Title: string;
	    Duration: number;
	
	    static createFrom(source: any = {}) {
	        return new PlayInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.RawURL = source["RawURL"];
	        this.ProxyURL = source["ProxyURL"];
	        this.ExpiresAt = this.convertValues(source["ExpiresAt"], time.Time);
	        this.Title = source["Title"];
	        this.Duration = source["Duration"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class QRCodeResponse {
	    url: string;
	    qrcode_key: string;
	    expire_at: time.Time;
	
	    static createFrom(source: any = {}) {
	        return new QRCodeResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.url = source["url"];
	        this.qrcode_key = source["qrcode_key"];
	        this.expire_at = this.convertValues(source["expire_at"], time.Time);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class UserInfo {
	    uid: number;
	    username: string;
	    face: string;
	    level: number;
	    vip_type: number;
	
	    static createFrom(source: any = {}) {
	        return new UserInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.uid = source["uid"];
	        this.username = source["username"];
	        this.face = source["face"];
	        this.level = source["level"];
	        this.vip_type = source["vip_type"];
	    }
	}

}

export namespace time {
	
	export class Time {
	
	
	    static createFrom(source: any = {}) {
	        return new Time(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	
	    }
	}

}


# Coretet iOS Mobile App Setup Guide

## Overview

This document provides a comprehensive guide for setting up an iOS mobile app to interface with the Coretet web application. The mobile app will focus on playlist reading and track rating/commenting functionality.

## Tech Stack

### Core Framework
- **SwiftUI** with iOS 17+ deployment target for modern declarative UI
- **Swift 6** with async/await patterns for concurrent programming
- **Combine** framework for reactive data flow

### Backend Integration
- **Supabase Swift SDK** for authentication and database operations
- **URLSession** with async/await for additional API calls
- **Codable** protocols for type-safe JSON parsing

### Architecture Pattern
- **MVVM** (Model-View-ViewModel) with @Observable macro
- **Repository pattern** for data access layer
- **Coordinator pattern** for navigation flow
- **Dependency injection** for testability

## Data Models

### Core Models

```swift
// Track model matching TypeScript interface
struct Track: Codable, Identifiable {
    let id: String
    let name: String
    let url: String
    let duration: Double
    let category: TrackCategory
    let uploadedAt: Date
    let tags: [String]
    
    // Metadata
    let artist: String?
    let collection: String?
    let key: String?
    let tempo: Int?
    let timeSignature: String?
    let mood: String?
    let genre: String?
    let notes: String?
    
    // Ratings
    var listened: Bool?
    var liked: Bool?
    var loved: Bool?
    
    // Variations
    let primaryTrackId: String?
    let variationCount: Int?
    
    // Timestamps
    let updatedAt: Date?
    let deletedAt: Date?
}

enum TrackCategory: String, Codable, CaseIterable {
    case songs = "songs"
    case demos = "demos"
    case ideas = "ideas"
    case voiceMemos = "voice-memos"
    case finalVersions = "final-versions"
    case livePerformances = "live-performances"
}

struct Playlist: Codable, Identifiable {
    let id: String
    let name: String
    let description: String?
    let userId: String
    let createdAt: Date
    let updatedAt: Date
    let trackCount: Int?
    let isPublic: Bool
}

struct PlaylistTrack: Codable {
    let playlistId: String
    let trackId: String
    let position: Int
    let addedAt: Date
    let track: Track?
}

enum RatingType: String, CaseIterable {
    case listened = "listened"
    case liked = "liked"
    case loved = "loved"
}

struct TrackRating: Codable {
    let id: String
    let trackId: String
    let userId: String?
    let collaboratorId: String?
    let rating: RatingType
    let createdAt: Date
}

struct User: Codable {
    let id: String
    let email: String
    let storageUsed: Int
    let storageLimit: Int
    let isActive: Bool
    let createdAt: Date
}

struct Collaborator: Codable {
    let id: String
    let email: String
    let name: String?
    let createdAt: Date
}
```

## Design System

### Color Themes

The app supports 6 color themes matching the web application:

#### 1. Forest Theme (Default)
```swift
extension Color {
    static let forestDark = Color(hex: "0A0F0D")
    static let forestMain = Color(hex: "1A1F1A")
    static let forestLight = Color(hex: "2A2F2A")
    static let accentYellow = Color(hex: "FFD93D")
    static let accentCoral = Color(hex: "FF6B6B")
    static let silver = Color(hex: "C0C0C0")
}
```

#### 2. Studio Sessions
- Warm professional tones
- Background: #1C1816, #2C2826, #3C3836
- Accents: #FF8C42, #FFD166

#### 3. Midnight Jazz
- Cool blue palette
- Background: #0D1B2A, #1B263B, #2B3648
- Accents: #7EC8E3, #FFE66D

#### 4. Vintage Tape
- Classic red/yellow theme
- Background: #2B1911, #3B291A, #4B392A
- Accents: #FF4E50, #F9D423

#### 5. Aurora
- High contrast pink/cyan
- Background: #0A0F1C, #1A1F2C, #2A2F3C
- Accents: #FF006E, #00F5FF

#### 6. Natural Studio
- Refined earth tones
- Background: #1A1611, #2A261F, #3A362F
- Accents: #E8B04B, #A8763E

### Typography

```swift
extension Font {
    static let appTitle = Font.custom("Anton", size: 28)
        .fallback(Font.system(size: 28, weight: .heavy))
    
    static let appBody = Font.custom("Quicksand", size: 16)
        .fallback(Font.system(size: 16))
    
    static let appCaption = Font.custom("Quicksand", size: 14)
        .fallback(Font.system(size: 14))
}
```

### Component Library

#### 1. RatingButton Component
```swift
struct RatingButton: View {
    let type: RatingType
    @Binding var isActive: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Image(systemName: icon)
                .foregroundColor(isActive ? activeColor : .gray)
                .frame(width: 44, height: 44)
                .background(isActive ? activeColor.opacity(0.1) : Color.gray.opacity(0.1))
                .cornerRadius(12)
        }
    }
    
    private var icon: String {
        switch type {
        case .listened: return "headphones"
        case .liked: return "star.fill"
        case .loved: return "heart.fill"
        }
    }
    
    private var activeColor: Color {
        switch type {
        case .listened: return .blue
        case .liked: return .yellow
        case .loved: return .pink
        }
    }
}
```

#### 2. PlaylistCard Component
```swift
struct PlaylistCard: View {
    let playlist: Playlist
    let trackCount: Int
    let lastUpdated: Date
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(playlist.name)
                .font(.appTitle)
                .foregroundColor(.silver)
            
            if let description = playlist.description {
                Text(description)
                    .font(.appCaption)
                    .foregroundColor(.silver.opacity(0.7))
                    .lineLimit(2)
            }
            
            HStack {
                Label("\(trackCount) tracks", systemImage: "music.note.list")
                Spacer()
                Text(lastUpdated.formatted(.relative))
            }
            .font(.appCaption)
            .foregroundColor(.silver.opacity(0.5))
        }
        .padding()
        .background(Color.forestMain)
        .cornerRadius(12)
    }
}
```

## Authentication

### Two-Tier Authentication System

#### 1. Main User Authentication (Supabase Auth)
```swift
@MainActor
class AuthService: ObservableObject {
    @Published var user: User?
    @Published var session: Session?
    @Published var isAuthenticated = false
    
    private let supabase = SupabaseClient(
        supabaseURL: URL(string: "YOUR_SUPABASE_URL")!,
        supabaseKey: "YOUR_SUPABASE_ANON_KEY"
    )
    
    func signIn(email: String, password: String) async throws {
        let response = try await supabase.auth.signIn(
            email: email,
            password: password
        )
        self.session = response.session
        self.user = response.user
        self.isAuthenticated = true
    }
    
    func signOut() async throws {
        try await supabase.auth.signOut()
        self.session = nil
        self.user = nil
        self.isAuthenticated = false
    }
}
```

#### 2. Collaborator Authentication (Lightweight)
```swift
@MainActor
class CollaboratorAuthService: ObservableObject {
    @Published var collaborator: Collaborator?
    @Published var isAuthenticated = false
    
    func signIn(email: String, password: String) async throws {
        // Custom API call for collaborator auth
        let response = try await APIClient.shared.collaboratorSignIn(
            email: email,
            password: password
        )
        self.collaborator = response.collaborator
        self.isAuthenticated = true
        
        // Store session token in Keychain
        try KeychainService.save(token: response.token, for: "collaborator_token")
    }
}
```

## API Integration

### Service Layer Structure

```swift
protocol PlaylistServiceProtocol {
    func fetchPlaylists() async throws -> [Playlist]
    func fetchSharedPlaylists() async throws -> [Playlist]
    func fetchPlaylistTracks(playlistId: String) async throws -> [PlaylistTrack]
}

class PlaylistService: PlaylistServiceProtocol {
    private let supabase: SupabaseClient
    
    func fetchPlaylists() async throws -> [Playlist] {
        let response = try await supabase
            .from("playlists")
            .select("*")
            .eq("user_id", AuthService.shared.user?.id ?? "")
            .execute()
        
        return try JSONDecoder().decode([Playlist].self, from: response.data)
    }
    
    func fetchSharedPlaylists() async throws -> [Playlist] {
        let response = try await supabase
            .from("playlist_shares")
            .select("*, playlists(*)")
            .eq("shared_with", AuthService.shared.user?.email ?? "")
            .execute()
        
        return try JSONDecoder().decode([Playlist].self, from: response.data)
    }
}
```

### Rating Service

```swift
class RatingService {
    func updateTrackRating(trackId: String, rating: RatingType) async throws {
        if let userId = AuthService.shared.user?.id {
            // Main user rating
            try await supabase
                .from("user_track_ratings")
                .upsert([
                    "user_id": userId,
                    "track_id": trackId,
                    rating.rawValue: true
                ])
                .execute()
        } else if let collaboratorId = CollaboratorAuthService.shared.collaborator?.id {
            // Collaborator rating
            try await supabase
                .from("track_ratings")
                .upsert([
                    "collaborator_id": collaboratorId,
                    "track_id": trackId,
                    "rating": rating.rawValue
                ])
                .execute()
        }
    }
}
```

## Key Features Implementation

### Phase 1 - Core Features (MVP)

1. **Authentication**
   - Main user sign in/out
   - Collaborator access
   - Session persistence

2. **Playlist Browsing**
   - View personal playlists
   - View shared playlists
   - Search playlists

3. **Track Management**
   - View track details
   - Play audio preview
   - View track metadata

4. **Rating System**
   - Three-tier rating (listened/liked/loved)
   - Visual feedback
   - Sync with backend

5. **Comments/Notes**
   - Add notes to tracks
   - View existing notes
   - Edit/delete notes

### Phase 2 - Enhanced Features

1. **Offline Mode**
   - Cache playlists locally
   - Queue rating updates
   - Sync when online

2. **Advanced Search**
   - Filter by category
   - Search by metadata
   - Recent searches

3. **Audio Features**
   - Waveform visualization
   - Playback queue
   - Background playback

4. **Collaboration**
   - Real-time updates
   - Share playlists
   - View collaborator ratings

5. **Customization**
   - Theme switching
   - Preferences sync
   - Haptic feedback settings

## Project Structure

```
CoretetMobile/
├── App/
│   ├── CoretetApp.swift
│   ├── AppDelegate.swift
│   └── SceneDelegate.swift
├── Core/
│   ├── Network/
│   │   ├── APIClient.swift
│   │   └── NetworkError.swift
│   ├── Storage/
│   │   ├── KeychainService.swift
│   │   └── CacheManager.swift
│   └── Extensions/
├── Models/
│   ├── Track.swift
│   ├── Playlist.swift
│   ├── User.swift
│   └── Rating.swift
├── Services/
│   ├── AuthService.swift
│   ├── PlaylistService.swift
│   ├── RatingService.swift
│   └── AudioService.swift
├── Views/
│   ├── Authentication/
│   │   ├── LoginView.swift
│   │   └── CollaboratorLoginView.swift
│   ├── Playlists/
│   │   ├── PlaylistListView.swift
│   │   ├── PlaylistDetailView.swift
│   │   └── PlaylistCard.swift
│   ├── Tracks/
│   │   ├── TrackListView.swift
│   │   ├── TrackDetailView.swift
│   │   └── TrackRow.swift
│   ├── Components/
│   │   ├── RatingButton.swift
│   │   ├── AudioPlayer.swift
│   │   └── WaveformView.swift
│   └── Settings/
│       ├── SettingsView.swift
│       └── ThemeSelector.swift
├── ViewModels/
│   ├── PlaylistViewModel.swift
│   ├── TrackViewModel.swift
│   └── RatingViewModel.swift
├── Resources/
│   ├── Assets.xcassets
│   ├── Fonts/
│   └── Localizable.strings
└── Supporting Files/
    ├── Info.plist
    └── Entitlements.plist
```

## Dependencies

### Swift Package Manager

```swift
// Package.swift
dependencies: [
    .package(url: "https://github.com/supabase/supabase-swift", from: "2.0.0"),
    .package(url: "https://github.com/kean/Nuke", from: "12.0.0"), // Image caching
    .package(url: "https://github.com/airbnb/lottie-ios", from: "4.0.0"), // Animations
    .package(url: "https://github.com/kishikawakatsumi/KeychainAccess", from: "4.0.0"), // Keychain
    .package(url: "https://github.com/apple/swift-async-algorithms", from: "1.0.0") // Async utilities
]
```

## Security Considerations

### 1. Secure Storage
```swift
// Keychain wrapper for sensitive data
class KeychainService {
    static let shared = KeychainService()
    private let keychain = Keychain(service: "com.coretet.mobile")
    
    func saveToken(_ token: String, for key: String) throws {
        try keychain
            .accessibility(.whenUnlockedThisDeviceOnly)
            .set(token, key: key)
    }
    
    func getToken(for key: String) throws -> String? {
        try keychain.get(key)
    }
}
```

### 2. Biometric Authentication
```swift
// Face ID / Touch ID support
import LocalAuthentication

class BiometricAuthService {
    func authenticate() async throws -> Bool {
        let context = LAContext()
        var error: NSError?
        
        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
            throw AuthError.biometricsNotAvailable
        }
        
        return try await context.evaluatePolicy(
            .deviceOwnerAuthenticationWithBiometrics,
            localizedReason: "Access your playlists"
        )
    }
}
```

### 3. Network Security
- SSL certificate pinning for API calls
- Request signing for sensitive operations
- Token refresh mechanism
- Encrypted local storage for offline data

## UI/UX Guidelines

### Navigation Structure
```
TabView
├── Playlists (Tab 1)
│   ├── My Playlists
│   └── Shared with Me
├── Now Playing (Tab 2)
│   ├── Player Controls
│   └── Queue
└── Profile (Tab 3)
    ├── Settings
    └── Storage Info
```

### Gesture Support
- Swipe right on track for quick "liked" rating
- Long press for context menu
- Pull to refresh on lists
- Pinch to zoom on waveforms

### Accessibility
- VoiceOver support for all interactive elements
- Dynamic Type support
- High contrast mode support
- Haptic feedback for actions

## Performance Optimization

### 1. Image Caching
```swift
// Using Nuke for efficient image loading
struct TrackArtwork: View {
    let url: URL
    
    var body: some View {
        LazyImage(url: url) { state in
            if let image = state.image {
                image
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            } else {
                Color.forestMain
                    .overlay(ProgressView())
            }
        }
    }
}
```

### 2. List Virtualization
```swift
// Efficient list rendering
struct PlaylistTracksView: View {
    let tracks: [Track]
    
    var body: some View {
        LazyVStack(spacing: 0) {
            ForEach(tracks) { track in
                TrackRow(track: track)
                    .onAppear {
                        // Prefetch next batch if needed
                    }
            }
        }
    }
}
```

### 3. Background Tasks
- Rating sync in background
- Playlist prefetching
- Audio file caching
- Periodic data cleanup

## Testing Strategy

### Unit Tests
- Model serialization/deserialization
- Service layer logic
- ViewModel business logic
- Utility functions

### Integration Tests
- API communication
- Authentication flow
- Data persistence
- Offline/online sync

### UI Tests
- Critical user flows
- Rating interactions
- Navigation paths
- Theme switching

## Launch Checklist

1. **App Store Requirements**
   - [ ] App icon (1024x1024)
   - [ ] Screenshots for all device sizes
   - [ ] Privacy policy URL
   - [ ] App description and keywords

2. **Technical Requirements**
   - [ ] Crashlytics integration
   - [ ] Analytics setup
   - [ ] Push notification certificates
   - [ ] App Transport Security configuration

3. **Testing**
   - [ ] Beta testing via TestFlight
   - [ ] Performance profiling
   - [ ] Memory leak detection
   - [ ] Accessibility audit

4. **Documentation**
   - [ ] API documentation
   - [ ] Code documentation
   - [ ] User guide
   - [ ] Release notes

## Conclusion

This setup provides a solid foundation for building a native iOS app that seamlessly integrates with the Coretet web application. The architecture is designed to be scalable, maintainable, and provides an excellent user experience while maintaining consistency with the web app's design and functionality.
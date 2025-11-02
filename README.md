# Cassette Voicemail Recorder

Record your voice with a nostalgic giant cassette recorder — play, rewind, delete, or record a new message.

## Features

- 🎙️ **Record Voice**: Capture voicemail messages using your browser's microphone
- ▶️ **Play**: Listen to your recorded messages
- ⏪ **Rewind**: Jump back to the start of the recording
- 🗑️ **Delete**: Remove recordings with confirmation
- 🎬 **Record New**: Start fresh recordings anytime
- 🎨 **Retro Design**: Beautiful vintage cassette tape interface

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to the URL shown (typically `http://localhost:5173`)

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

1. Click **Record New** to start recording (grant microphone permissions when prompted)
2. Click **Record New** again (or the button will show "Recording…") to stop recording
3. Use **Play** to listen to your recording
4. Use **Rewind** to restart playback from the beginning
5. Use **Delete** to remove the recording (with confirmation)
6. Record new messages anytime with **Record New**

## Browser Compatibility

This app uses the MediaRecorder API, which is supported in:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari 14.1+
- Opera (latest)

**Note**: HTTPS is required for microphone access in most browsers (localhost works for development).

## Technologies

- React 18
- Vite
- MediaRecorder API (browser native)
- CSS3 (with animations and gradients)

## License

MIT

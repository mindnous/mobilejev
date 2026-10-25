# Changelog

The development history of mobilejev, from the Expo template to the current app. Each step lists the request and what changed.
Local paths, user names, IP addresses and pairing codes have been removed.

## 1. Wireless debugging

> find my android phone for wireless debugging. IP: `<phone-ip>`

> please pair with my device, ip: `<phone-ip>`, code: `<pairing-code>`

- I paired the phone with `adb pair` and connected it with `adb connect <phone-ip>:<port>`. The port changes every time wireless debugging is turned on again.
- Expo failed with `Device adb-XXXX._adb-tls-connect._tcp is in state (2)`. Fix: disconnect the mDNS device name and restart adb with `ADB_MDNS_AUTO_CONNECT=0` so only the `ip:port` device is listed.

## 2. Gradle build errors

> here is the error when running npx expo run:android

> run npx expo run:android, but why it is just "IDLE"?

- The `classes.jar ... Index 6 out of bounds` error came from a broken (0-byte) class left in the `react-native-worklets` build cache. Fix: delete `node_modules/react-native-worklets/android/build` and build again.
- The "IDLE" lines are Gradle workers waiting for other tasks. The llama.rn native build from source takes 10–15 minutes the first time.

## 3. Image + noul crash, Simple and Advanced SystemOne

> when I feed image, and put prompt to ask noul question, the app crash, and the gguf needs to be loaded again with the mmproj, can you solve the issue? make sure that systemone can feed both image and text. Also, keep the raw json with separate image upload location for users who want flexibility under "Advance" option. Also put "simple" option that has: image upload area, prompt, and choice/options

- The crash was a native `GGML_ASSERT`: image tokens are decoded in one non-causal batch, so `n_ubatch` must be at least the number of image tokens.
- SystemOne now has two modes:
  - **Simple:** image area, prompt, and question cards (choice/noul, instructions, options as `name: description` lines).
  - **Advanced:** the raw request JSON plus a separate image upload. The image is appended to `images`.

## 4. Model load failures and UI freeze

> I get failed to load gguf model now. And is it possible to make loading gguf model to not make the UI to freeze?

- A 2048 batch made context creation fail. I set the batch back to 512 (`BATCH_SIZE`) and capped the image tokens instead.
- The freeze came from `DocumentPicker` with `copyToCacheDirectory: true`, which copies the file on the UI thread. Now it uses `copyToCacheDirectory: false` plus an async `File.copy()` from expo-file-system.
- Old model copies (about 8 GB) were cleaned up. Only one copy is kept now (`deleteAllCopies`).
- Loading shows progress in percent.

## 5. Grammar error

> Get error: Unexpected empty gramma stack after accepting piece: @ (31)

- This was the first sign of the GPU bug (step 7): the GPU produced garbage tokens.

## 6. Max image tokens setting

> please also make sure that the max image token is 512 (please put this setting's max image token in the UI). Use use_gpu: true please

- Added a "max image tokens" field (1–512, `MAX_IMAGE_TOKENS`) and passed it as `image_max_tokens` when loading the mmproj.
- The mmproj loads with `use_gpu: true`.

## 7. Probabilities like jev_experiment, and the GPU bug

> I get another error: The model did not answer with a letter for: Is the children happy in the image? (it wanted "P") The output should be probability like in jev_experiment. Please follow bugfix as in this folder

> its okay, I have tested it in pc, and it works, but it doesn't work in the android for some reason

> exactly, the error happen when I use GPU? When using CPU, the output is correct. Can you solve the issue?

> Still the same error. Can you solve it?

- SystemOne follows jev_experiment's method:
  - one forward pass per question, with options labelled A, B, …
  - a grammar that forces one letter, with `n_probs: 20` and `post_sampling_probs: false`
  - probabilities are the summed letter probabilities, normalized
  - fallback (as in `jev_base.py`): if no letter is in the top probabilities, use the forced letter with probability 1
- Added a CPU/GPU switch, saved in settings.
- **Root cause on GPU:** on the Adreno 830, the OpenCL Q4_K matrix multiply (the `coopk_dp4a` kernel) gives wrong results for 2–4 tokens. I checked this with `test-backend-ops` built with the NDK.
- **Fix:** `plugins/with-opencl-fix.js` sets `GGML_OPENCL_COOPK_DP4A=0` in `MainApplication` before llama.rn loads.

## 8. App icon

> and also use index.svg as the main icon of this android app

- I generated `icon.png` and the Android adaptive icon layers (foreground, background, monochrome) from `index.svg`.

## 9. PocketPal comparison

> btw, pocketpal ai also use llama.rn, can you double check how did they solve this issue and still be able to run gguf model with GPU?

- PocketPal uses llama.rn rc.7, which doesn't have the broken kernel. It sets environment variables the same way (`Os.setenv` in `MainApplication`), which confirmed the approach in step 7.

## 10. Brand colors and waiting page

> can you change the color and the waiting page's icon and color to follow the index.png and index.svg (for waiting page, use index.png), and for button, use the same color as the index image

- Brand color `#F97316` (orange) is used for buttons and links (`BrandColor` in `theme.ts`).
- The splash and waiting page are white with the `index.png` logo (`logo.png`, `splash-logo.png`).

## 11. Settings page and auto-load

> please hide the Chat menu for now, and add "setting" floating page on the bottom right corner, that users can input default model, prompt, question, and choices for systemon. So that they have all settings ready when opening the app (when doing auto loading, please put notification so that they now what happen with the app)

- The Chat tab is hidden (`hidden` on its tab trigger) but its code is kept.
- Added a floating Settings button at the bottom right. Its page has:
  - auto-load on/off
  - CPU/GPU
  - model and mmproj upload
  - max image tokens
  - SystemOne default prompt and questions
- Settings are saved to `settings.json` in the app documents folder.
- The last loaded model and mmproj load automatically when the app opens:
  - a top notification banner shows progress and errors
  - a crash guard skips auto-load if the previous auto-load crashed

## 12. Smaller APK

> please make sure unnecessary packages are removed from this folder, and make it as efficient as possible. Keep all gpu cpu functions there, and prioritize making the app size smaller

> can you tell me what's the final apk size? and is it already optimized?

- Removed web files, unused template assets, the reset-project script and unused packages.
- `plugins/with-small-apk.js`:
  - builds arm64-v8a only
  - compresses the native libraries (`useLegacyPackaging`)
  - turns on minify and shrinkResources for release
  - skips the Hexagon assets
- `expo.autolinking.exclude` drops `@expo/ui`, `react-native-gesture-handler` and `react-native-reanimated`. These are installed only as peer dependencies and the app doesn't use them.
- I removed `RECORD_AUDIO` (image picker `microphonePermission: false`).
- All 7 CPU/GPU llama.rn variants are kept.
- **Size:** the release APK went from 181 MB (debug) to 49.75 MB.

## 13. Testing over wireless debugging

> how to test the app with wireless debuggin? the ip: `<phone-ip>:<port>`

- Run `adb connect <phone-ip>:<port>`, then `adb install -r android/app/build/outputs/apk/release/app-release.apk`. The phone must be unlocked or the install hangs.
- The release build is signed with the debug key, so it installs over the dev build.

## 14. Gear icon, Done button, lean SystemOne, Live page

> For the setting page, can you use "gear" icon? and can you put "done" button on the bottom-center? after saving the setting, remove all the prompt and questions and choices from SystemOne page, and keep Run and answer area. And also, add "Live" page where it can use image from camera, that can be used with saved prompt and choice, to get streaming output. Please make the update as lean as possible. Avoid unnecessary updates

- The Settings button now shows a gear icon, and Done sits at the bottom center.
- SystemOne Simple mode is now image, Run and answers. It uses the prompt and questions saved in Settings.
- **New Live tab (expo-camera):**
  - it takes a frame, runs SystemOne with the saved questions, shows the answers and ms per frame, and repeats until Stop
  - it stops when you leave the tab, and frames are deleted after use
- `AnswerList` is shared by SystemOne and Live.
- **Size:** the APK is 53.9 MB with the camera.

## 15. Waiting page delay and author

> add 1.5s delay when user load the app to show the wait icon, also add "by Folksagent" at the bottom center of the wait page. Just use normal black Text (not big text)

- The waiting page stays for 1.5 s, then fades out. "by Folksagent" appears at the bottom center in normal black text.

## 16. Repository

> please put all of this app update to mobilejev repo in the ./mobilejev folder, avoid the build folder. If the packages folder/files are unnecessary, please also skip it

- I copied the source, assets, plugins and config into this repo. These were left out:
  - `node_modules`, `android/` (generated by `npx expo prebuild`), `.expo`
  - editor folders
  - the template LICENSE and README

> add guide_troubleshoot.md that contains all of our conversion and responses, while removing my path, username, and ip address inside. So that I can check my dev history

> can you put the my questions into changelog.md and list all the changes that I do since the start of the app

- Added this file.

## 17. Model page into Settings, bigger logo, header logo, app name

> can you remove the "Model" page, and just use it from floating "Setting" gear button to setup the model? and make the icon index.svg or index.png bigger by 20%. Simplify intro "Pick a .gguf model file from your phone....." into -> "Load .gguf model file to run 100% on the device, will be automatically loaded the next time you open it, and no data leaks to the internet.

> can you put icon on the top of the app? just a small one though

> Make the app name "Mobilejev" instead of "mobilejev". And the index icon, put some white background color, and put the icon in the top-center.

> The index icon on the top-center are still not full, please put white background color on the same height of the icon, and width full width size of the phone.

> can you use assets/images/android-icon-monochrome.png instead? and use the same background as the rest of the UI color, put it at the same place: top-center, make it larger 1.5x

- The Model tab is removed. Model setup lives only in Settings (gear), with the new intro text.
- SystemOne is now the first tab (route `index`).
- The waiting-page logo is 20% bigger. The native splash image is plain white now, because Android's round splash mask would cut off a logo that wide.
- Every page shows the app icon (`android-icon-monochrome.png`) at the top center. It's 1.5x the earlier logo height and tinted with the text color, so it works on both the light and dark backgrounds.
- The app name is now "Mobilejev".

## 18. Live camera fills the page

> remove "Asks the prompts and questions saved in Settings" from Live page, and make the camera view fill the vacant position if there is any space

> the Live's camera area is smaller now, can you make it to fill the whole screen if there is any space left?

- Removed the help text from the Live page.
- The camera view now stretches into the free space on the page (`flex: 1`, at least 240 dp) instead of using a fixed 3:4 size.
- The bottom padding of every page is now 88 dp instead of 168 dp. It was also counting the tab bar, which already sits outside the page. This leaves just enough room for the gear button.

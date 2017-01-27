export LD_LIBRARY_PATH=/usr/local/lib
export PKG_CONFIG_PATH=/usr/local/lib/pkgconfig

cd /Documents/VoiceRecognition/Basic
pocketsphinx_continuous -hmm /usr/local/share/pocketsphinx/model/en-us/en-us -lm BasicLanguageModel.lm -dict BasicDictionary.dic -samprate 44100 -inmic yes -nfft 2048

pocketsphinx_continuous.exe -hmm ./model/en-us/en-us -lm ./model/AdvancedLanguageModel.lm -dict ./model/AdvancedDictionary.dic -samprate 48000 -inmic yes -nfft 2048 -infile ./output.wav
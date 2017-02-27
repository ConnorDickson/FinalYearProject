export LD_LIBRARY_PATH=/usr/local/lib
export PKG_CONFIG_PATH=/usr/local/lib/pkgconfig
pocketsphinx_continuous -hmm /usr/local/share/pocketsphinx/model/en-us/en-us -lm ../LanguageFiles/LanguageModel.lm -dict ../LanguageFiles/Dictionary.dic -samprate 48000 -inmic yes -nfft 2048 -infile $1

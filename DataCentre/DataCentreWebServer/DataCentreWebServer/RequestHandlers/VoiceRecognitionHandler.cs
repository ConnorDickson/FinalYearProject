using DataCentreWebServer.Helpers;
using System;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;

namespace DataCentreWebServer.RequestHandlers
{
    public class VoiceRecognitionHandler
    {
        FileSystemHelper _fileSystemHelper;
        VoiceRecognitionHelper _voiceRecognitionHelper;
        public VoiceRecognitionHandler(FileSystemHelper fileSystemHelper, VoiceRecognitionHelper voiceRecognitionHelper)
        {
            _fileSystemHelper = fileSystemHelper;
            _voiceRecognitionHelper = voiceRecognitionHelper;
        }

        internal async Task<HttpResponseMessage> ReceivePostDataForProcessing(HttpRequestMessage request)
        {
            var response = new HttpResponseMessage();

            try
            {
                var rootPath = HttpRuntime.AppDomainAppPath.TrimEnd('\\');
                var filePath = rootPath + "\\Pocketsphinx\\output.wav";
                var pocketsphinxexe = rootPath + "\\Pocketsphinx\\pocketsphinx_continuous.exe ";
                var pocketsphinxargs = "-hmm " + rootPath + "\\Pocketsphinx\\model\\en-us\\en-us "
                                        + "-lm " + rootPath + "\\Pocketsphinx\\model\\LanguageModel.lm "
                                        + "-dict " + rootPath + "\\Pocketsphinx\\model\\Dictionary.dic "
                                        + "-samprate 48000 -inmic yes -nfft 2048 "
                                        + "-infile " + filePath;

                await _fileSystemHelper.WriteFileToDisk(request, filePath);

                var output = _voiceRecognitionHelper.ProcessVoice(pocketsphinxexe, pocketsphinxargs);

                response.StatusCode = HttpStatusCode.OK;

                response.Content = new StringContent(output.Trim());

                return response;
            }
            catch (Exception ex)
            {
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.Content = new StringContent(ex.Message);
                return response;
            }
        }

        internal async Task<HttpResponseMessage> ReceivePreProcessedPostData(HttpRequestMessage request)
        {
            var response = new HttpResponseMessage();
            var preprocessedString = await request.Content.ReadAsStringAsync();
            response.Content = new StringContent(preprocessedString.Trim());
            response.StatusCode = HttpStatusCode.OK;
            return response;
        }
    }
}
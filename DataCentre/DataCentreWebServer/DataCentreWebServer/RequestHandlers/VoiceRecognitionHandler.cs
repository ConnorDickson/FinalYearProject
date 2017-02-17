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
                var filePath = rootPath + "\\Pocketsphinx\\output" + Guid.NewGuid() + ".wav";
                var pocketsphinxexe = rootPath + "\\Pocketsphinx\\pocketsphinx_continuous.exe ";
                var pocketsphinxargs = "-hmm " + rootPath + "\\Pocketsphinx\\model\\en-us\\en-us "
                                        + "-lm " + rootPath + "\\Pocketsphinx\\model\\LanguageModel.lm "
                                        + "-dict " + rootPath + "\\Pocketsphinx\\model\\Dictionary.dic "
                                        + "-samprate 48000 -inmic yes -nfft 2048 "
                                        + "-infile " + filePath;

                var wroteFile = await _fileSystemHelper.WriteFileToDisk(request, filePath);

                if (!wroteFile)
                {
                    LoggerHelper.Log("Something went wrong writing the file");
                    return new HttpResponseMessage(HttpStatusCode.InternalServerError);
                }

                var output = _voiceRecognitionHelper.ProcessVoice(pocketsphinxexe, pocketsphinxargs);

                response.StatusCode = HttpStatusCode.OK;

                response.Content = new StringContent(output.Trim());

                _fileSystemHelper.DeleteFile(filePath);

                return response;
            }
            catch (Exception ex)
            {
                LoggerHelper.Log("An error occurred while processing the voice: " + ex.Message + Environment.NewLine + ex.StackTrace);

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
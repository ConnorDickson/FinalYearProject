using DataCentreWebServer.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;

namespace DataCentreWebServer.RequestHandlers
{
    //Handles the logic of the voice recongition requests
    public class VoiceRecognitionHandler
    {
        FileSystemHelper _fileSystemHelper;
        VoiceRecognitionHelper _voiceRecognitionHelper;
        
        //classes injected using dependancy injection
        public VoiceRecognitionHandler(FileSystemHelper fileSystemHelper, VoiceRecognitionHelper voiceRecognitionHelper)
        {
            _fileSystemHelper = fileSystemHelper;
            _voiceRecognitionHelper = voiceRecognitionHelper;
        }

        /// <summary>
        /// Checks if the request is pre-processed or not and calls the correct method to handle the request
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        internal Task<HttpResponseMessage> EvaluateVoiceRequest(HttpRequestMessage request)
        {
            IEnumerable<string> dataPreProcessedHeader;
            request.Headers.TryGetValues("DataIsPreProcessed", out dataPreProcessedHeader);

            var dataIsPreProcessed = false;
            if(dataPreProcessedHeader != null && dataPreProcessedHeader.FirstOrDefault() == "True")
            {
                dataIsPreProcessed = true;
            }

            if(dataIsPreProcessed)
            {
                return ReceivePreProcessedPostData(request);
            }
            else
            {
                return ReceivePostDataForProcessing(request);
            }
        }

        /// <summary>
        /// The request is not pre-processed
        /// Run voice recognition on the recording
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
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

                //save the file to disk to run voice recognition
                var wroteFile = await _fileSystemHelper.WriteFileToDisk(request, filePath);

                if (!wroteFile)
                {
                    LoggerHelper.Log("Something went wrong writing the file");
                    return new HttpResponseMessage(HttpStatusCode.InternalServerError);
                }

                //execute the voice recognition
                var output = _voiceRecognitionHelper.ProcessVoice(pocketsphinxexe, pocketsphinxargs);

                response.StatusCode = HttpStatusCode.OK;

                response.Content = new StringContent(output.Trim());

                //remove the file that was saved to disk
                _fileSystemHelper.DeleteFile(filePath);

                //return content to user
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

        /// <summary>
        /// The data is pre-processed.
        /// Return the string to the client
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
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
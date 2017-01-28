using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;

namespace DataCentreWebServer.RequestHandlers
{
    public class VoiceRecognitionHandler
    {
        internal async Task<HttpResponseMessage> ReceivePostDataForProcessing(HttpRequestMessage request)
        {
            var response = new HttpResponseMessage();

            try
            {
                var rootPath = HttpRuntime.AppDomainAppPath.TrimEnd('\\');
                var requestStream = await request.Content.ReadAsStreamAsync();
                using(var fs = File.Create(rootPath + "\\Pocketsphinx\\output.wav"))
                {
                    var bytesInStream = new byte[requestStream.Length];
                    requestStream.Read(bytesInStream, 0, bytesInStream.Length);
                    fs.Write(bytesInStream, 0, bytesInStream.Length);
                }

                var outputError = false;
                
                var pocketsphinxExe = rootPath + "\\Pocketsphinx\\pocketsphinx_continuous.exe ";
                var hmm = "-hmm " + rootPath + "\\Pocketsphinx\\model\\en-us\\en-us ";
                var lm = "-lm " + rootPath + "\\Pocketsphinx\\model\\AdvancedLanguageModel.lm ";
                var dic = "-dict " + rootPath + "\\Pocketsphinx\\model\\AdvancedDictionary.dic ";
                var args = "-samprate 48000 -inmic yes -nfft 2048 ";
                var infile = "-infile " + rootPath + "\\Pocketsphinx\\output.wav";

                Process p = new Process();
                p.StartInfo.UseShellExecute = false;
                if (outputError)
                {
                    p.StartInfo.RedirectStandardError = true;
                }
                else
                {
                    p.StartInfo.RedirectStandardOutput = true;
                }
                p.StartInfo.FileName = pocketsphinxExe;
                p.StartInfo.Arguments = hmm + lm + dic + args + infile;
                p.Start();

                string output = string.Empty;

                if (outputError)
                {
                    output = p.StandardError.ReadToEnd();
                }
                else
                {
                    output = p.StandardOutput.ReadToEnd();
                }

                p.WaitForExit();
                
                response.StatusCode = HttpStatusCode.OK;

                response.Content = new StringContent("You said \"" + output.Trim() + "\"");
                return response;
            }
            catch(Exception ex)
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
            response.Content = new StringContent("You sent pre processed data: " + preprocessedString);
            response.StatusCode = HttpStatusCode.OK;
            return response;
        }
    }
}
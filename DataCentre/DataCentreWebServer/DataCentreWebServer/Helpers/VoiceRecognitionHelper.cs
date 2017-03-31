using System.Diagnostics;

namespace DataCentreWebServer.Helpers
{
    //provides methods that help with voice recognition
    public class VoiceRecognitionHelper
    {
        /// <summary>
        /// Executes the voice recognition exe at the location passed into the method 
        /// with the arguments passed in
        /// </summary>
        /// <param name="pocketsphinxexe"></param>
        /// <param name="pocketsphinxargs"></param>
        /// <returns></returns>
        public string ProcessVoice(string pocketsphinxexe, string pocketsphinxargs)
        {
            var outputError = false;

            // spawn a new process
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

            p.StartInfo.FileName = pocketsphinxexe;
            p.StartInfo.Arguments = pocketsphinxargs;

            p.Start();

            string output = string.Empty;

            // read the output from the process, this will be what the voice said
            if (outputError)
            {
                output = p.StandardError.ReadToEnd();
            }
            else
            {
                output = p.StandardOutput.ReadToEnd();
            }

            p.WaitForExit();

            //return what the voice said (or the error if something went wrong)
            return output;
        }
    }
}
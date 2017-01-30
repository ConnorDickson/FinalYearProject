using System.Diagnostics;

namespace DataCentreWebServer.Helpers
{
    public class VoiceRecognitionHelper
    {
        public string ProcessVoice(string pocketsphinxexe, string pocketsphinxargs)
        {
            var outputError = false;

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

            if (outputError)
            {
                output = p.StandardError.ReadToEnd();
            }
            else
            {
                output = p.StandardOutput.ReadToEnd();
            }

            p.WaitForExit();

            return output;
        }
    }
}
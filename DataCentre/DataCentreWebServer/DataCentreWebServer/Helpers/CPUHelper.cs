using System;
using System.Diagnostics;
using System.Management;

namespace DataCentreWebServer.Helpers
{
    //https://stevescodingblog.co.uk/real-time-system-resource-monitor-with-signalr-mvc-knockout-and-webapi/
    public class CPUHelper
    {
        static PerformanceCounter _cpuCounter, _memUsageCounter;
        
        public static MachineMetrics measureCPU()
        {
            try
            {
                DateTime lastPollTime = DateTime.MinValue;

                _cpuCounter = new PerformanceCounter();
                _cpuCounter.CategoryName = "Processor";
                _cpuCounter.CounterName = "% Processor Time";
                _cpuCounter.InstanceName = "_Total";
                _memUsageCounter = new PerformanceCounter("Memory", "Available KBytes");
                
                double cpuTime;
                ulong memUsage, totalMemory; // Get the stuff we need to send 

                //This has to be measured twice to get the CPU use
                GetMetrics(out cpuTime, out memUsage, out totalMemory); // Send the data 
                //GetMetrics(out cpuTime, out memUsage, out totalMemory); // Send the data 

                return new MachineMetrics
                {
                    MachineName = Environment.MachineName,
                    Processor = cpuTime,
                    MemUsage = memUsage,
                    TotalMemory = totalMemory
                };
            }
            catch (Exception ex)
            {
                LoggerHelper.Log("Exception gathering machine metrics: " + ex.Message + ex.StackTrace);
                return null;
            }
        }

        static void GetMetrics(out double processorTime, out ulong memUsage, out ulong totalMemory)
        {
            processorTime = (double)_cpuCounter.NextValue();
            memUsage = (ulong)_memUsageCounter.NextValue();
            totalMemory = 0; // Get total memory from WMI 

            var memQuery = new ObjectQuery("SELECT * FROM CIM_OperatingSystem");
            var searcher = new ManagementObjectSearcher(memQuery);
            foreach (var item in searcher.Get())
            {
                totalMemory = (ulong)item["TotalVisibleMemorySize"];
            }
        }
    }
}
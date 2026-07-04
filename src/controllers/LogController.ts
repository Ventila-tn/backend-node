import { Request, Response } from 'express';
import { LogService } from '../services/LogService';
import { LogEntryRequest } from '../types';

export class LogController {
  private logService: LogService;

  constructor() {
    this.logService = new LogService();
  }

  createLog = async (req: Request, res: Response) => {
    try {
      const request: LogEntryRequest = req.body;
      const ipAddress = this.logService.getClientIpAddress(req);
      const log = await this.logService.createLog(request, ipAddress);
      res.status(201).json(log);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  getAllLogs = async (req: Request, res: Response) => {
    try {
      const { logType, ipAddress, startDate, endDate } = req.query;

      if (logType || ipAddress || startDate || endDate) {
        const logs = await this.logService.getLogsByFilters(
          logType as string || null,
          ipAddress as string || null,
          startDate ? new Date(startDate as string) : null,
          endDate ? new Date(endDate as string) : null
        );
        return res.json(logs);
      }

      const logs = await this.logService.getAllLogs();
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  getLogsByType = async (req: Request, res: Response) => {
    try {
      const logType = req.params.logType;
      const logs = await this.logService.getLogsByType(logType);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  getDistinctIpAddresses = async (req: Request, res: Response) => {
    try {
      const ips = await this.logService.getAllDistinctIpAddresses();
      res.json(ips);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

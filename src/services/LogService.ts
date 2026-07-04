import pool from '../config/database';
import { LogEntry, LogEntryRequest, LogEntryDTO } from '../types';

export class LogService {

  async createLog(request: LogEntryRequest, ipAddress: string | null): Promise<LogEntryDTO> {
    const result = await pool.query<LogEntry>(
      `INSERT INTO log_entries (
         ip_address, 
         timestamp, 
         log_type, 
         message, 
         details, 
         user_agent, 
         page_url
       ) 
       VALUES ($1, NOW(), $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        ipAddress,
        request.logType,
        request.message,
        JSON.stringify(request.details),
        request.userAgent,
        request.pageUrl
      ]
    );

    return this.mapToDTO(result.rows[0]);
  }

  async getAllLogs(): Promise<LogEntryDTO[]> {
    const result = await pool.query<LogEntry>(
      'SELECT * FROM log_entries ORDER BY timestamp DESC'
    );
    
    return result.rows.map(log => this.mapToDTO(log));
  }

  async getLogsByType(logType: string): Promise<LogEntryDTO[]> {
    const result = await pool.query<LogEntry>(
      'SELECT * FROM log_entries WHERE log_type = $1 ORDER BY timestamp DESC',
      [logType]
    );
    
    return result.rows.map(log => this.mapToDTO(log));
  }

  async getLogsByFilters(
    logType: string | null,
    ipAddress: string | null,
    startDate: Date | null,
    endDate: Date | null
  ): Promise<LogEntryDTO[]> {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (logType) {
      conditions.push(`log_type = $${paramIndex++}`);
      params.push(logType);
    }

    if (ipAddress) {
      conditions.push(`ip_address = $${paramIndex++}`);
      params.push(ipAddress);
    }

    if (startDate) {
      conditions.push(`timestamp >= $${paramIndex++}`);
      params.push(startDate);
    }

    if (endDate) {
      conditions.push(`timestamp <= $${paramIndex++}`);
      params.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `SELECT * FROM log_entries ${whereClause} ORDER BY timestamp DESC`;

    const result = await pool.query<LogEntry>(query, params);
    return result.rows.map(log => this.mapToDTO(log));
  }

  async getAllDistinctIpAddresses(): Promise<string[]> {
    const result = await pool.query<{ ip_address: string }>(
      'SELECT DISTINCT ip_address FROM log_entries WHERE ip_address IS NOT NULL ORDER BY ip_address'
    );
    
    return result.rows.map(row => row.ip_address);
  }

  getClientIpAddress(req: any): string | null {
    let ipAddress = req.headers['x-forwarded-for'];
    
    if (!ipAddress || ipAddress === 'unknown') {
      ipAddress = req.headers['proxy-client-ip'];
    }
    
    if (!ipAddress || ipAddress === 'unknown') {
      ipAddress = req.headers['wl-proxy-client-ip'];
    }
    
    if (!ipAddress || ipAddress === 'unknown') {
      ipAddress = req.connection.remoteAddress || req.socket.remoteAddress;
    }
    
    // If multiple IPs, take the first one
    if (ipAddress && ipAddress.includes(',')) {
      ipAddress = ipAddress.split(',')[0].trim();
    }
    
    return ipAddress || null;
  }

  private mapToDTO(logEntry: LogEntry): LogEntryDTO {
    return {
      id: logEntry.id,
      ipAddress: logEntry.ip_address,
      timestamp: logEntry.timestamp,
      logType: logEntry.log_type,
      message: logEntry.message,
      details: logEntry.details,
      userAgent: logEntry.user_agent,
      pageUrl: logEntry.page_url
    };
  }
}

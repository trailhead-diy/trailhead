import fetch from 'node-fetch';
import { Ok, Err } from '@esteban-url/trailhead-cli';
import type { Result } from '@esteban-url/trailhead-cli';
import type { RequestOptions, ResponseData, RetryOptions } from './types.js';

export class HttpClient {
  private async makeRequest(options: RequestOptions): Promise<Result<ResponseData>> {
    try {
      const { method, url, headers = {}, body, timeout = 10000 } = options;
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'api-client-cli/1.0.0',
          ...headers,
        },
        body,
        timeout,
      });

      let data: any;
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      const responseData: ResponseData = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data,
      };

      return Ok(responseData);
    } catch (error) {
      return Err(new Error(`Request failed: ${(error as Error).message}`));
    }
  }

  async request(options: RequestOptions, retryOptions?: RetryOptions): Promise<Result<ResponseData>> {
    const maxAttempts = retryOptions?.attempts || 1;
    let delay = retryOptions?.delay || 1000;
    const backoff = retryOptions?.backoff || 2;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const result = await this.makeRequest(options);
      
      if (result.success) {
        const response = result.value;
        // Don't retry on success or client errors (4xx)
        if (response.status < 500) {
          return result;
        }
      }
      
      // Don't wait after the last attempt
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= backoff;
      }
    }

    return Err(new Error(`Request failed after ${maxAttempts} attempts`));
  }
}
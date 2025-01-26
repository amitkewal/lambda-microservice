const { get } = require('../src/handlers/product');
const AWS = require('aws-sdk');

jest.mock('aws-sdk', () => {
  const mockDynamoDB = {
    get: jest.fn().mockReturnThis(),
    promise: jest.fn(),
  };

  return {
    DynamoDB: {
      DocumentClient: jest.fn(() => mockDynamoDB),
    },
  };
});

describe('get product', () => {
  it('should return the product if found', async () => {
    const mockDynamoDB = new AWS.DynamoDB.DocumentClient();
    mockDynamoDB.promise.mockResolvedValueOnce({
      Item: {
        ProductId: 'test-id',
        Name: 'Product A',
        Description: 'Description A',
        Price: 100,
        Category: 'Category A',
        Stock: 10,
      },
    });

    const event = {
      pathParameters: {
        ProductId: 'test-id',
      },
    };

    const result = await get(event);

    expect(mockDynamoDB.get).toHaveBeenCalledWith({
      TableName: 'Products',
      Key: {
        ProductId: 'test-id',
      },
    });

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toMatchObject({
      ProductId: 'test-id',
      Name: 'Product A',
      Description: 'Description A',
      Price: 100,
      Category: 'Category A',
      Stock: 10,
    });
  });

  it('should return 404 if the product is not found', async () => {
    const mockDynamoDB = new AWS.DynamoDB.DocumentClient();
    mockDynamoDB.promise.mockResolvedValueOnce({}); // No Item returned

    const event = {
      pathParameters: {
        ProductId: 'non-existent-id',
      },
    };

    const result = await get(event);

    expect(mockDynamoDB.get).toHaveBeenCalledWith({
      TableName: 'Products',
      Key: {
        ProductId: 'non-existent-id',
      },
    });

    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body)).toMatchObject({
      message: 'Product not found',
    });
  });
});

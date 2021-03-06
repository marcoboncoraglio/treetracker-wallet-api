const TokenService = require("./TokenService");
const sinon = require("sinon");
const TokenRepository = require("../repositories/TokenRepository");
const HttpError = require("../utils/HttpError");
const jestExpect = require("expect");
const chai = require("chai");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const {expect} = chai;
const Wallet = require("../models/Wallet");
const Token = require("../models/Token");
const WalletService = require("../services/WalletService");
const Session = require("../models/Session");
const TransactionRepository = require("../repositories/TransactionRepository");

describe("Token", () => {
  let tokenService;
  let session = new Session();

  beforeEach(() => {
    tokenService = new TokenService();
  });

  afterEach(() => {
    sinon.restore();
  });

  it("getById() with id which doesn't exist, should throw 404", async () => {
    dsinon.stub(TokenRepository.prototype, "getById").rejects(new HttpError(404, "not found"));
    await jestExpect(async () => {
      await tokenService.getById("testUuid");
    }).rejects.toThrow('not found');
    TokenRepository.prototype.getById.restore();
  });

  it("getTokensByBundle", async () => {
    const wallet = new Wallet(1, session);
    const fn = sinon.stub(TokenRepository.prototype, "getByFilter").resolves([
      {
        id: 1,
      }
    ], session);
    const result = await tokenService.getTokensByBundle(wallet, 1);
    expect(result).a("array").lengthOf(1);
    expect(result[0]).instanceOf(Token);
    expect(fn).calledWith({
      wallet_id: 1,
      transfer_pending: false,
    },{
      limit: 1,
    });
  });

  it("countTokenByWallet", async () => {
    const wallet = new Wallet(1, session);
    const fn = sinon.stub(TokenRepository.prototype, "countByFilter").resolves(1);
    const result = await tokenService.countTokenByWallet(wallet);
    expect(result).eq(1);
    expect(fn).calledWith({
      wallet_id: 1,
    });
    fn.restore();
  });

  it("convertToResponse", async () => {
    const transactionObject = {
      id: 1,
      token_id: 1,
      source_wallet_id: 1,
      destination_wallet_id: 1,
    }
    sinon.stub(TokenService.prototype, "getById").resolves(new Token({
      id: 1,
      uuid: "xxx",
      capture_id: 1,
    }));
    sinon.stub(WalletService.prototype, "getById").resolves(new Wallet({
      id: 1,
      name: "testName",
    }));
    const result = await tokenService.convertToResponse(transactionObject);
    expect(result).property("token").eq("xxx");
    expect(result).property("sender_wallet").eq("testName");
    expect(result).property("receiver_wallet").eq("testName");
  });

  describe("getTokensByTransferId", () => {

    it("Successfuly", async () => {
      const token = new Token({id:2});
      const transaction = {
        id: 1,
        token_id: 2,
      };
      const fn = sinon.stub(TransactionRepository.prototype, "getByFilter").resolves([transaction]);
      const fn2 = sinon.stub(TokenService.prototype, "getById").resolves(token);
      const tokens = await tokenService.getTokensByTransferId(1);
      expect(fn).calledWith({
        transfer_id: 1,
      })
      expect(fn2).calledWith(2);
      expect(tokens).lengthOf(1);
    });
  });


});

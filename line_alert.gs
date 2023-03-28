// グローバル設定値
//ここのパラメータを自由に変更して使用してください。
const CONFIG = {
    SEARCH_KEYWORD: 'subject:(【MY_ALERT】)', // Gmailで検索するためのキーワード //tradingviewのアラート名を【MY_ALERT】と設定
    MAX_RESULTS: 20, // 検索結果の最大件数
    LINE_NOTIFY_API_URL: 'https://notify-api.line.me/api/notify', // LINE Notify APIのURL
    LINE_TOKEN: 'LINEアクセストークン', // LINE Notifyのアクセストークンを入力((注)公開しないようにしてください)
    NOTIFICATION_FREQUENCY: { // 通知の頻度を設定するオブジェクト //夜間は連続通知するなどの用途
      from: '00:00', // 開始時間
      to: '12:00', // 終了時間
      value: 60, // 通知頻度（秒）
    },
  };
  
// Gmailから特定の件名のメールを検索して、指定されたトークンを持つLINEユーザーに通知する
function sendGmailNotification() {
    const threads = GmailApp.search(CONFIG.SEARCH_KEYWORD, 0, CONFIG.MAX_RESULTS); // 検索キーワードでメールを検索する
    const messages = GmailApp.getMessagesForThreads(threads); // スレッドからメッセージを取得する
  
    // スレッド内の各メッセージについて、未通知のものに対してLINE通知を送信する
    messages.forEach((threadMessages) => {
      threadMessages.forEach((message) => {
        if (!message.isStarred()) { // まだ通知していないメッセージのみ処理する
          const dateString = formatDate(message.getDate()); // メッセージの日時をフォーマットする
          const subject = message.getSubject(); // メッセージの件名を取得する
          const body = message.getPlainBody().match(/【MY_MSG】(.*)/);; // メッセージの本文を取得する //Tradingviewのアラームメッセージで表示したいメッセージを【MY_MSG】を前に入れる
          sendLineNotification(dateString, subject, body); // LINE通知を送信する
          message.star(); // 通知済みのメッセージにスターをつける
        }
      });
    });
  }
  
 // LINEに通知を送信する関数
function sendLineNotification(dateString, subject, body) {
    // 通知メッセージを作成する（改行あり）
    const message = `\n【日時】${dateString}\n【件名】${subject}\n【本文】${body}`;
    // LINE Notify APIに渡すデータを作成する
    const payload = { message: message };
  
    // ヘッダにアクセストークンを含めたオプションを作成する
    const options = {
      method: 'post', // POSTリクエストを送信する
      payload: payload, // 通知メッセージを含むデータを渡す
      headers: {
        Authorization: `Bearer ${CONFIG.LINE_TOKEN}`, // アクセストークンをヘッダに含める
      },
    };
  
    // 通知の頻度を判定する
    const now = new Date(); // 現在時刻を取得する
    const start = new Date(now.toDateString() + ' ' + CONFIG.NOTIFICATION_FREQUENCY.from); // 通知開始時刻を取得する
    const end = new Date(now.toDateString() + ' ' + CONFIG.NOTIFICATION_FREQUENCY.to); // 通知終了時刻を取得する
    const timeDiff = now.getTime() - start.getTime(); // 現在時刻と通知開始時刻の差をミリ秒単位で取得する
    const diffInMinutes = Math.floor(timeDiff / (1000 * 60)); // 差を分単位に変換する
    const frequency = diffInMinutes >= 0 && now >= start && now <= end ? CONFIG.NOTIFICATION_FREQUENCY.value : 1; // 通知頻度を判定する
  
    // LINE通知を実行する
    try {
      for (let i = 0; i < frequency; i++) {
        UrlFetchApp.fetch(CONFIG.LINE_NOTIFY_API_URL, options); // LINE Notify APIを実行する
        Utilities.sleep(1000 / frequency); // 通知の間隔を設定する
      }
    } catch (error) {
      console.error(error);
      throw new Error('LINE通知の送信に失敗しました。'); // エラーが発生した場合は例外をスローする
    }
  }
  
  // 日付を文字列にフォーマットする関数
  function formatDate(date) {
    const timeZone = Session.getScriptTimeZone(); // スクリプトのタイムゾーンを取得する
    const dateFormat = 'yyyy/MM/dd HH:mm'; // 日付のフォーマットを指定する
    return Utilities.formatDate(date, timeZone, dateFormat); // 日付を指定したフォーマットの文字列に変換する
  }
  
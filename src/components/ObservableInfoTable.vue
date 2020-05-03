<template>
  <table class="table is-fullwidth">
    <tbody v-if="observable['type'] == 'Hostname'">
      <tr>
        <th>Created</th>
        <td>{{ observable.created }}</td>
      </tr>
      <tr>
        <th>Domain?</th>
        <td>{{ observable.domain ? "Yes" : "No" }}</td>
      </tr>
      <tr>
        <th>IDNA</th>
        <td>{{ observable.idna }}</td>
      </tr>
    </tbody>

    <tbody v-if="observable.type == 'Url'">
      <tr>
        <th>Created</th>
        <td>{{ observable.created }}</td>
      </tr>
      <tr>
        <th>Host</th>
        <td>{{ observable.parsed_url.netloc }}</td>
      </tr>
      <tr>
        <th>Path</th>
        <td>{{ observable.parsed_url.path }}</td>
      </tr>
      <tr>
        <th>Scheme</th>
        <td>{{ observable.parsed_url.scheme }}</td>
      </tr>
      <tr>
        <th>Port</th>
        <td>{{ observable.parsed_url.port }}</td>
      </tr>
    </tbody>
  </table>
</template>

<script>
export default {
  name: "ObservableInfoTable",
  props: ["observable"]
};
</script>

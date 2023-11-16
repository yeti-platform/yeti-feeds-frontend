<template>
  <div class="tile is-ancestor">
    <div class="tile is-vertical">
      <!-- first group of tiles -->
      <div class="tile">
        <div class="tile is-parent">
          <div class="tile is-child card">
            <header class="card-header warning">
              <p class="card-header-title">
                <b-icon pack="fas" icon="crosshairs" size="is-small"></b-icon>
                Indicator matches <b-tag rounded type="is-dark">{{ searchResults.matches.length }}</b-tag>
              </p>
            </header>
            <div class="card-content">
              <b-table :data="searchResults.matches" :narrowed="true">
                <template v-slot:default="match">
                  <b-table-column field="name" label="Name">
                    <router-link :to="{ name: 'IndicatorDetails', params: { id: match.row[1].id } }">
                      {{ match.row[1].name }}
                    </router-link>
                  </b-table-column>
                  <b-table-column field="observable" label="Observable">
                    <code>{{ match.row[0] }}</code>
                  </b-table-column>
                  <b-table-column field="diamond" label="Diamond edge">
                    {{ match.row[1].diamond }}
                  </b-table-column>
                  <b-table-column field="relevant_tags" label="Suggested tags">
                    <b-taglist>
                      <b-tag v-for="tag in match.row[1].relevant_tags" v-bind:key="tag">
                        {{ tag }}
                      </b-tag>
                    </b-taglist>
                  </b-table-column>
                </template>
                <template #empty>
                  <div class="has-text-centered">No indicator matches</div>
                </template>
              </b-table>
            </div>
          </div>
        </div>
        <div class="tile is-parent">
          <div class="tile is-child card">
            <header class="card-header danger">
              <p class="card-header-title">
                <b-icon pack="fas" icon="project-diagram" size="is-small"></b-icon>
                Related entities <b-tag rounded type="is-dark">{{ searchResults.entities.length }}</b-tag>
              </p>
            </header>
            <div class="card-content">
              <b-table :data="searchResults.entities.map(tuple => tuple[1])" :narrowed="true">
                <template v-slot:default="entity">
                  <b-table-column field="name" label="Name">
                    <router-link :to="{ name: 'EntityDetails', params: { id: entity.row.id } }">
                      {{ entity.row.name }}
                    </router-link>
                  </b-table-column>
                  <b-table-column field="type" label="Type">
                    <code>{{ entity.row.type }}</code>
                  </b-table-column>
                </template>
                <template #empty>
                  <div class="has-text-centered">No associated entities</div>
                </template>
              </b-table>
            </div>
          </div>
        </div>
      </div>
      <!-- end first group of tiles -->
      <div class="tile">
        <div class="tile is-parent">
          <div class="tile is-child card">
            <header class="card-header info">
              <p class="card-header-title">
                <b-icon pack="fas" icon="database" size="is-small"></b-icon>
                Observables found in database <b-tag rounded type="is-dark">{{ searchResults.known.length }}</b-tag>
              </p>
            </header>
            <div class="card-content">
              <b-table :data="searchResults['known']" :narrowed="true">
                <template v-slot:default="known">
                  <b-table-column field="value" label="Value">
                    <router-link :to="{ name: 'ObservableDetails', params: { id: known.row.id } }">
                      {{ known.row.value }}
                    </router-link>
                  </b-table-column>
                  <b-table-column field="tags" label="Tags">
                    <b-taglist>
                      <b-tag
                        v-for="tagName in Object.keys(known.row.tags)"
                        v-bind:key="tagName"
                        :type="known.row.tags[tagName].fresh ? 'is-primary' : ''"
                      >
                        {{ tagName }}
                      </b-tag>
                    </b-taglist>
                  </b-table-column>
                  <b-table-column field="context" label="Context">
                    <b-taglist>
                      <b-tag v-for="context in known.row.context" v-bind:key="context.source">
                        {{ context.source }}
                      </b-tag>
                    </b-taglist>
                  </b-table-column>
                  <b-table-column field="created" label="Created on">
                    {{ new Date(known.row.created).toISOString() }}
                  </b-table-column>
                </template>
                <template #empty>
                  <div class="has-text-centered">No known observables</div>
                </template>
              </b-table>
            </div>
          </div>
        </div>
      </div>
      <!-- Unkown -->
      <div class="tile">
        <div class="tile is-parent">
          <div class="tile is-child card">
            <header class="card-header light">
              <p class="card-header-title">
                <b-icon pack="fas" icon="question" size="is-small"></b-icon>
                Unknown observables <b-tag rounded type="is-dark">{{ searchResults.unknown.length }}</b-tag>
              </p>
            </header>
            <div class="card-content">
              <ul v-if="searchResults['unknown'].length">
                <li v-for="observable in searchResults['unknown']" v-bind:key="observable">{{ observable }}</li>
              </ul>
              <div v-else>No unknown observables</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "SearchResults",
  data() {
    return {};
  },
  props: ["searchResults"]
};
</script>

<style scoped lang="scss">
@import "@/style.scss";

p .icon {
  margin-right: 0.5em;
}

span.tag {
  margin-left: 0.5rem;
}
</style>

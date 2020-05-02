<template>
  <div class="tile is-ancestor">
    <div class="tile is-vertical">
      <!-- first group of tiles -->
      <div class="tile">
        <div class="tile is-parent">
          <div class="tile is-child card">
            <header class="card-header is-warning">
              <p class="card-header-title">
                <b-icon pack="fas" icon="crosshairs" size="is-small"></b-icon>
                Indicator matches <b-tag rounded type="is-dark">{{ searchResults.matches.length }}</b-tag>
              </p>
            </header>
            <div class="card-content" v-if="searchResults['matches'].length">
              <b-table :data="searchResults['matches']" :narrowed="true">
                <template v-slot:default="match">
                  <b-table-column field="name" label="Name">
                    <a href="#"> {{ match.row.name }} </a>
                  </b-table-column>
                  <b-table-column field="observable" label="Observable">
                    <code>{{ match.row.observable.value }}</code>
                  </b-table-column>
                  <b-table-column field="diamond" label="Diamond edge">
                    {{ match.row.diamond }}
                  </b-table-column>
                  <b-table-column field="suggested_tags" label="Suggested tags">
                    <b-taglist>
                      <b-tag v-for="tag in match.row.suggested_tags" v-bind:key="tag">
                        {{ tag }}
                      </b-tag>
                    </b-taglist>
                  </b-table-column>
                  <b-table-column field="id" label="ID">
                    {{ match.row.id }}
                  </b-table-column>
                </template>
              </b-table>
            </div>
          </div>
        </div>
        <div class="tile is-parent">
          <div class="tile is-child card">
            <header class="card-header is-danger">
              <p class="card-header-title">
                <b-icon pack="fas" icon="project-diagram" size="is-small"></b-icon>
                Related entities <b-tag rounded type="is-dark">{{ searchResults.entities.length }}</b-tag>
              </p>
            </header>
            <div class="card-content" v-if="searchResults['entities'].length">
              <b-table :data="searchResults['entities']" :narrowed="true">
                <template v-slot:default="entity">
                  <b-table-column field="name" label="Name">
                    <a href="#"> {{ entity.row.name }} </a>
                  </b-table-column>
                  <b-table-column field="type" label="Type">
                    <code>{{ entity.row.type }}</code>
                  </b-table-column>
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
            <header class="card-header is-info">
              <p class="card-header-title">
                <b-icon pack="fas" icon="database" size="is-small"></b-icon>
                Observables found in database <b-tag rounded type="is-dark">{{ searchResults.known.length }}</b-tag>
              </p>
            </header>
            <div class="card-content" v-if="searchResults['known'].length">
              <b-table :data="searchResults['known']" :narrowed="true">
                <template v-slot:default="known">
                  <b-table-column field="value" label="Value">
                    <a href="#"> {{ known.row.value }} </a>
                  </b-table-column>
                  <b-table-column field="tags" label="Tags">
                    <b-taglist>
                      <b-tag v-for="tag in known.row.tags" v-bind:key="tag.name" :type="tag.fresh ? 'is-primary' : ''">
                        {{ tag.name }}
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
              </b-table>
            </div>
          </div>
        </div>
      </div>
      <!-- Unkown -->
      <div class="tile">
        <div class="tile is-parent">
          <div class="tile is-child card">
            <header class="card-header is-light">
              <p class="card-header-title">
                <b-icon pack="fas" icon="question" size="is-small"></b-icon>
                Unknown observables <b-tag rounded type="is-dark">{{ searchResults.unknown.length }}</b-tag>
              </p>
            </header>
            <div class="card-content" v-if="searchResults['unknown'].length">
              <ul>
                <li v-for="observable in searchResults['unknown']" v-bind:key="observable">{{ observable }}</li>
              </ul>
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

.card-header.is-warning {
  background: $warning;
}

.card-header.is-danger {
  background: $danger;
}

.card-header.is-info {
  background: $info;
}

.card-header.is-light {
  background: $light;
}

span.tag {
  margin-left: 0.5rem;
}
</style>
